import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // Adjust path if your server client helper is elsewhere

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || file?.name || "Untitled Meeting";

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Generate unique storage path: {user_id}/{timestamp}-{filename}
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("meeting-audio")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
    }

    // Insert meeting record into database
    const { data: meeting, error: dbError } = await supabase
      .from("meetings")
      .insert({
        user_id: user.id,
        title: title,
        audio_file_path: filePath,
        status: "uploading",
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json({ error: "Failed to create meeting record" }, { status: 500 });
    }

    return NextResponse.json({ success: true, meeting });
  } catch (err: any) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}