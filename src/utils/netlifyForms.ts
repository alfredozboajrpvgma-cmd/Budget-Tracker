const FORM_NAME = 'support-question';

interface SupportQuestionPayload {
  name: string;
  email: string;
  question: string;
}

export async function submitSupportQuestion(payload: SupportQuestionPayload): Promise<void> {
  const body = new URLSearchParams({
    'form-name': FORM_NAME,
    name: payload.name.trim() || 'PinkCloud user',
    email: payload.email.trim() || 'not-provided',
    question: payload.question.trim(),
  });

  const response = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error('Could not submit your question.');
  }
}
