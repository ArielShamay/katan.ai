/**
 * קובץ עוזר לטעינת הקונפיגורציה בדפדפן
 * BoardGenerator משתמש ב-fs שלא עובד בדפדפן, אז אנחנו טוענים את הקונפיגורציה מראש
 */

import boardConfig from '../../config/board_static.json';

export function getBoardConfig() {
  return boardConfig;
}
