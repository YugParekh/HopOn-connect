import { API_BASE_URL } from "@/lib/api";

export const generateEventDescription = async (basicIdea: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-description`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea: basicIdea }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate description");
    }

    const data = await response.json();
    return data.description;
  } catch (error: any) {
    console.error("Error generating description:", error);
    throw new Error(error.message || "Failed to generate description. Please try again.");
  }
};

export const generateEventTitle = async (basicIdea: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-title`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea: basicIdea }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate title");
    }

    const data = await response.json();
    return data.title;
  } catch (error: any) {
    console.error("Error generating title:", error);
    throw new Error(error.message || "Failed to generate title. Please try again.");
  }
};
