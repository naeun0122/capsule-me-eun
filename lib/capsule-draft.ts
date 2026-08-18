export type CapsuleDraft = {
  to: string;
  letter: string;
  openAt: string;
};

const DRAFT_KEY = "capsule-me:draft";

export function saveCapsuleDraft(draft: CapsuleDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function readCapsuleDraft(): CapsuleDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CapsuleDraft>;

    return {
      to: typeof parsed.to === "string" ? parsed.to : "",
      letter: typeof parsed.letter === "string" ? parsed.letter : "",
      openAt: typeof parsed.openAt === "string" ? parsed.openAt : "",
    };
  } catch {
    return null;
  }
}

export function clearCapsuleDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}
