(() => {
  'use strict';

  const CATEGORIES = [
    { id: 'Technology',  ru: 'Технологии' },
    { id: 'Business',    ru: 'Бизнес' },
    { id: 'Science',     ru: 'Наука' },
    { id: 'Education',   ru: 'Образование' },
    { id: 'Social',      ru: 'Социальный' },
    { id: 'Environment', ru: 'Экология' },
    { id: 'Design',      ru: 'Дизайн' },
    { id: 'Other',       ru: 'Другое' },
  ];

  const STAGES = [
    { id: 'Idea',        ru: 'Идея' },
    { id: 'Development', ru: 'Разработка' },
    { id: 'MVP',         ru: 'MVP' },
    { id: 'Active',      ru: 'Активный' },
    { id: 'Completed',   ru: 'Завершён' },
  ];

  const SKILLS = [
    'Programming', 'Design', 'Marketing', 'Research', 'SMM', 'Business',
    'Public Speaking', 'Video', 'Copywriting', 'Data', 'Robotics', 'Teaching',
  ];

  const SKILLS_RU = {
    'Programming': 'Программирование', 'Design': 'Дизайн', 'Marketing': 'Маркетинг',
    'Research': 'Исследования', 'SMM': 'SMM', 'Business': 'Бизнес',
    'Public Speaking': 'Публичные выступления', 'Video': 'Видео', 'Copywriting': 'Тексты',
    'Data': 'Данные', 'Robotics': 'Робототехника', 'Teaching': 'Преподавание',
  };

  const ROLES = ['Founder', 'Developer', 'Designer', 'Marketing', 'Researcher', 'SMM', 'Content'];
  const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Атырау', 'Павлодар', 'Тараз', 'Онлайн'];
  const FORMATS = [{ id: 'online', ru: 'Онлайн' }, { id: 'offline', ru: 'Офлайн' }, { id: 'hybrid', ru: 'Гибрид' }];
  const LANGS = [{ id: 'kz', ru: 'Қазақша' }, { id: 'ru', ru: 'Русский' }, { id: 'en', ru: 'English' }];
  const EVENT_TYPES = [
    { id: 'hackathon', ru: 'Хакатон' }, { id: 'mun', ru: 'MUN' }, { id: 'olympiad', ru: 'Олимпиада' },
    { id: 'contest', ru: 'Конкурс проектов' }, { id: 'workshop', ru: 'Мастер-класс' },
    { id: 'webinar', ru: 'Вебинар' }, { id: 'conference', ru: 'Конференция' },
  ];
  const REPORT_REASONS = [
    { id: 'inappropriate', ru: 'Неприемлемый контент' },
    { id: 'spam', ru: 'Спам' },
    { id: 'fake', ru: 'Недостоверная информация' },
    { id: 'harassment', ru: 'Травля или угрозы' },
    { id: 'fraud', ru: 'Мошенничество' },
    { id: 'other', ru: 'Другое' },
  ];

  window.BASTAU = {
    VERSION: 'bastau.v1',
    CATEGORIES, STAGES, SKILLS, SKILLS_RU, ROLES, CITIES, FORMATS, LANGS, EVENT_TYPES, REPORT_REASONS
  };
})();