/* BASTAU - запись уведомлений в базу

   Таблицу notifications умели только читать: строки в неё никто не добавлял,
   поэтому колокольчик всегда был пустым. Эта обёртка пишет строку через
   POST /api/notifications и используется везде, где что-то происходит
   с заявками и составом команды.                                            */

/* Уведомление — дело второстепенное: если запись не удалась, основное
   действие (принять заявку, добавить участника) всё равно считается
   выполненным. Поэтому ошибки только логируем. */
export async function notifyUser(userId, header, content) {
  if (!userId || !header) return false;
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, header, content: content || '' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.error('Не удалось записать уведомление:', err);
    return false;
  }
}

/* Готовые тексты — чтобы формулировки не расходились по файлам. */
export const NOTIFY = {
  applied: (userName, projectTitle) => ({
    header: 'Новая заявка в проект',
    content: `${userName} хочет присоединиться к проекту «${projectTitle}»`,
  }),
  accepted: (projectTitle, role) => ({
    header: 'Заявку приняли',
    content: `Вы в команде проекта «${projectTitle}»${role ? ` — роль: ${role}` : ''}`,
  }),
  rejected: (projectTitle) => ({
    header: 'Заявку отклонили',
    content: `Заявка в проект «${projectTitle}» отклонена. Посмотрите другие проекты — их много.`,
  }),
  added: (ownerName, projectTitle, role) => ({
    header: 'Вас добавили в команду',
    content: `${ownerName} добавил вас в проект «${projectTitle}»${role ? ` — роль: ${role}` : ''}`,
  }),
  removed: (projectTitle) => ({
    header: 'Вы больше не в команде',
    content: `Вас исключили из команды проекта «${projectTitle}»`,
  }),
};
