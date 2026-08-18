import { FirebaseError } from "firebase/app";

export function authErrorMessage(error: unknown) {
  if (
    error instanceof FirebaseError &&
    (error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request")
  ) {
    return null;
  }

  if (error instanceof FirebaseError && error.code === "auth/unauthorized-domain") {
    return "이 도메인은 Firebase 인증에 허용되지 않았습니다.";
  }

  return "구글 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}
