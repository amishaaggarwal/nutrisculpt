import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Replace this with your Google Apps Script Web App URL
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || "";
    
    if (!GOOGLE_SCRIPT_URL) {
      return NextResponse.json(
        { error: "Google Apps Script URL not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.text();
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
