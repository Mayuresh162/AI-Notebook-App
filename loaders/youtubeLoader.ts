import { YoutubeTranscript } from "youtube-transcript";

export async function loadYoutube(url: string) {
  const transcript = await YoutubeTranscript.fetchTranscript(url);

  const text = transcript.map((t) => t.text).join(" ");

  return {
    text,
    source: url,
  };
}
