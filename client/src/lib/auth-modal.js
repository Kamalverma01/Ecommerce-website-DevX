export const AUTH_MODAL_EVENT = "devx:open-auth-modal";

export function openAuthModal(redirectTo = "/shop/home") {
  window.dispatchEvent(
    new CustomEvent(AUTH_MODAL_EVENT, {
      detail: {
        redirectTo,
      },
    })
  );
}
