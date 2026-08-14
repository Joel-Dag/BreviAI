import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/profile";
import Groq from "groq-sdk";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured in environment variables." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });
    const supabase = await createClient();

    // Fetch meeting & transcripts
    const { data: meeting } = await supabase
      .from("meetings")
      .select("*, transcripts(*)")
      .eq("id", meetingId)
      .eq("user_id", user.id)
      .single();

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const transcriptRecord = Array.isArray(meeting.transcripts)
      ? meeting.transcripts[0]
      : meeting.transcripts;

    const transcriptText = transcriptRecord?.full_text || transcriptRecord?.raw_text;

    if (!transcriptText) {
      return NextResponse.json(
        { error: "No transcript available to summarize." },
        { status: 400 }
      );
    }

// Call Groq LLaMA 3.3 70B
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }, // Requires "json" explicitly in messages
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You are an expert executive assistant. Respond ONLY in valid JSON format. Summarize meeting transcripts into structured JSON:
{
  "executive_summary": "Concise 2-4 sentence summary.",
  "key_topics": ["Topic 1", "Topic 2"],
  "decisions": ["Decision 1", "Decision 2"],
  "action_items": [
    {
      "description": "Task description",
      "owner_name": "Assignee name or string null",
      "due_date": "YYYY-MM-DD or string null"
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Transcript:\n\n${transcriptText}`,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content || "{}";
    
    // Clean string before parsing
    const cleanedContent = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseErr) {
      console.error("JSON Parse Error on raw content:", rawContent);
      return NextResponse.json(
        { error: "AI generated invalid JSON structure." },
        { status: 500 }
      );
    }

    // 1. Save summary (Upsert/Delete-Insert)
    await supabase.from("summaries").delete().eq("meeting_id", meetingId);
    
    const { error: summaryErr } = await supabase.from("summaries").insert({
      meeting_id: meetingId,
      executive_summary: parsed.executive_summary || "No summary generated.",
      key_topics: Array.isArray(parsed.key_topics) ? parsed.key_topics : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    });

    if (summaryErr) {
      console.error("Supabase Summary Insert Error:", summaryErr);
      throw new Error(`Failed to save summary: ${summaryErr.message}`);
    }

    // 2. Save action items safely
    await supabase.from("action_items").delete().eq("meeting_id", meetingId);

    if (Array.isArray(parsed.action_items) && parsed.action_items.length > 0) {
      const rows = parsed.action_items.map((item: any) => {
        // Sanitize due_date to ensure invalid strings like "null" don't crash PostgreSQL DATE columns
        let validDueDate: string | null = null;
        if (item.due_date && item.due_date !== "null" && /^\d{4}-\d{2}-\d{2}$/.test(item.due_date)) {
          validDueDate = item.due_date;
        }

        return {
          meeting_id: meetingId,
          description: item.description || "Unspecified task",
          owner_name: item.owner_name && item.owner_name !== "null" ? item.owner_name : null,
          due_date: validDueDate,
          is_completed: false,
          is_confident: true,
        };
      });

      const { error: actionErr } = await supabase.from("action_items").insert(rows);
      if (actionErr) {
        console.error("Supabase Action Items Insert Error:", actionErr);
      }
    }

    // 3. Mark meeting status as done
    await supabase.from("meetings").update({ status: "done" }).eq("id", meetingId);

    return NextResponse.json({
      success: true,
      summary: parsed,
    });
  } catch (err: unknown) {
    console.error("Summarize Route Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal summarization error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
