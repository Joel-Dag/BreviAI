import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const supabase = await createClient();

    // 1. Authenticate User
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from("transcripts")
      .select("*")
      .eq("meeting_id", meetingId)
      .single();

    const transcriptText =
      transcript?.full_text || transcript?.raw_text || null;

    if (transcriptError || !transcriptText) {
      return NextResponse.json(
        { error: "Transcript not found for this meeting." },
        { status: 404 }
      );
    }

    // 3. Update Meeting Status to 'summarizing'
    await supabase
      .from("meetings")
      .update({ status: "summarizing" })
      .eq("id", meetingId);

    // 4. Initialize Groq SDK
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    const prompt = `
You are an expert AI meeting assistant. Analyze the following meeting transcript and generate:
1. An executive summary capturing the core overview.
2. A list of key topics discussed.
3. A list of key decisions made.
4. Any action items identified, with tasks, assignees (if mentioned), and due dates (if mentioned).

Respond ONLY in valid JSON with this exact structure:
{
  "executive_summary": "High level overview of the meeting...",
  "key_topics": ["Topic 1", "Topic 2"],
  "decisions": ["Decision 1", "Decision 2"],
  "action_items": [
    {
      "task": "Task description",
      "assignee": "Name or unassigned",
      "due_date": "YYYY-MM-DD or TBD"
    }
  ]
}

Transcript:
${transcriptText}
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from Groq API");
    }

    const result = JSON.parse(content);

    // 5. Insert into 'summaries' table matching exact schema columns
    const { error: summaryError } = await supabase
      .from("summaries")
      .insert({
        meeting_id: meetingId,
        executive_summary: result.executive_summary || result.overview || "",
        key_topics: result.key_topics || result.key_takeaways || [],
        decisions: result.decisions || [],
      });

    if (summaryError) {
      console.error("Error saving summary to Supabase:", summaryError);
    }

    // 6. Insert into 'action_items' table if any exist
    if (result.action_items && result.action_items.length > 0) {
      const actionItemsToInsert = result.action_items.map((item: any) => ({
        meeting_id: meetingId,
        task: item.task,
        assignee: item.assignee || "Unassigned",
        due_date: item.due_date || null,
      }));

      const { error: actionError } = await supabase
        .from("action_items")
        .insert(actionItemsToInsert);

      if (actionError) {
        console.error("Error saving action items to Supabase:", actionError);
      }
    }

    // 7. Update Meeting Status to 'completed'
    const { data: updatedMeeting, error: meetingUpdateError } = await supabase
      .from("meetings")
      .update({ status: "completed" })
      .eq("id", meetingId)
      .select()
      .maybeSingle();

    if (meetingUpdateError) {
      console.error("Failed to update status to completed:", meetingUpdateError);
    }

    return NextResponse.json({
      success: true,
      meeting: updatedMeeting,
      summary: result,
    });
  } catch (error: any) {
    console.error("Summarize route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate summary" },
      { status: 500 }
    );
  }
}