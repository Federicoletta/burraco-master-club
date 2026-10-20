// Utilità per la gestione dell'account sviluppatore

export const DEVELOPER_EMAILS = ['fedecoletta@gmail.com'];
export const DEVELOPER_UIDS = ['KRpSgqjedNTE3nmF6vnGXixL0EM2'];

/**
 * Riconosce se un utente (o email/uid/nome) è l'account ufficiale dello sviluppatore
 */
export function isDeveloperAccount(user, currentUser = null) {
  if (!user) return false;
  if (typeof user === 'string') {
    const val = user.trim().toLowerCase();
    if (DEVELOPER_EMAILS.includes(val) || DEVELOPER_UIDS.includes(user.trim())) return true;
    if (val === 'federico coletta') return true;
    if (currentUser && isDeveloperAccount(currentUser) && val === (currentUser.displayName || '').trim().toLowerCase()) return true;
    return false;
  }
  const email = (user.email || '').trim().toLowerCase();
  const uid = (user.uid || '').trim();
  if (DEVELOPER_EMAILS.includes(email) || DEVELOPER_UIDS.includes(uid)) return true;
  const name = (user.displayName || user.name || '').trim().toLowerCase();
  if (name === 'federico coletta') return true;
  if (user.isMe && currentUser && isDeveloperAccount(currentUser)) return true;
  return false;
}
