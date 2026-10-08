/* ==========================================================================
   BASTAU — справочники и демо-данные (сид)
   Все данные синтетические. Продовая версия заменяет этот файл на API.
   Даты: YYYY-MM-DD.
   ========================================================================== */
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
    { id: 'other', ru: 'Другое' },
  ];

  /* ------------------------------- Люди -------------------------------- */
  const users = [
    { id: 'u1', username: 'ala', name: 'Ала Сейтқали', city: 'Алматы', school: 'НИШ ФМН Алматы', grade: '11 класс',
      bio: 'Исследую городские проблемы через данные. Делаю MUN-конференции и провожу воркшопы по питчингу.',
      interests: ['Research', 'Business', 'MUN', 'Design'], skills: ['Research', 'Public Speaking', 'Business', 'Design'],
      achievements: ['Best Delegate, Almaty MUN 2025', 'Финалист Ecomarathon', '2 место, Case Battle KBTU', 'Стипендия Fly Away'],
      eventsCount: 12, role: 'Организатор', joined: '2025-09-14' },
    { id: 'u2', username: 'daniyar', name: 'Данияр Абдрахманов', city: 'Астана', school: 'Школа-лицей №66', grade: '10 класс',
      bio: 'Пишу на Python и Swift, собираю телеграм-ботов для школьных задач.',
      interests: ['Technology', 'Robotics'], skills: ['Programming', 'Data', 'Robotics'],
      achievements: ['Республиканская олимпиада по информатике — призёр'], eventsCount: 7, role: 'Разработчик', joined: '2025-10-02' },
    { id: 'u3', username: 'aigerim', name: 'Айгерим Нұрлан', city: 'Алматы', school: 'Гимназия №159', grade: '11 класс',
      bio: 'UI-дизайнер школьных проектов. Люблю чистую типографику и казахские орнаменты в интерфейсах.',
      interests: ['Design', 'Education'], skills: ['Design', 'SMM', 'Video'],
      achievements: ['Победитель Design Sprint 2026'], eventsCount: 9, role: 'Дизайнер', joined: '2025-11-20' },
    { id: 'u4', username: 'sanzhar', name: 'Санжар Ермек', city: 'Шымкент', school: 'Колледж КазГАСА', grade: '1 курс',
      bio: 'Интересуюсь экологией и городскими сервисами. Организую субботники и эко-квесты.',
      interests: ['Environment', 'Social'], skills: ['Business', 'Marketing', 'Public Speaking'],
      achievements: ['Грант Eco Network KZ'], eventsCount: 5, role: 'Организатор', joined: '2026-01-11' },
    { id: 'u5', username: 'kamila', name: 'Камила Тілеубай', city: 'Караганда', school: 'НИШ ХБН Караганда', grade: '10 класс',
      bio: 'Химия и биология — моя зона. Веду исследование качества воды в микрорайонах.',
      interests: ['Science', 'Environment'], skills: ['Research', 'Data', 'Copywriting'],
      achievements: ['Serpin Science Fair — 1 место'], eventsCount: 6, role: 'Исследователь', joined: '2026-02-03' },
    { id: 'u6', username: 'yerasyl', name: 'Ерасыл Жанболат', city: 'Астана', school: 'Astana IT University', grade: '1 курс',
      bio: 'Full-stack, но душа лежит к бэкенду. Делал школьный сайт расписания на 900 учеников.',
      interests: ['Technology', 'Business'], skills: ['Programming', 'Data'],
      achievements: ['Hack Astana 2026 — топ-10'], eventsCount: 8, role: 'Разработчик', joined: '2025-12-19' },
    { id: 'u7', username: 'dinara', name: 'Динара Қасым', city: 'Актобе', school: 'Школа-гимназия №21', grade: '9 класс',
      bio: 'Веду школьный медиацентр: рилсы, подкасты, репортажи с олимпиад.',
      interests: ['Social', 'Design'], skills: ['SMM', 'Video', 'Copywriting'],
      achievements: ['Медиафест «Дыбыс» — приз зрительских симпатий'], eventsCount: 4, role: 'SMM', joined: '2026-03-08' },
    { id: 'u8', username: 'timur', name: 'Тимур Оспан', city: 'Алматы', school: 'РФМШ', grade: '11 класс',
      bio: 'Робототехника и 3D-печать. Собрал руку-манипулятор для школьной лаборатории.',
      interests: ['Technology', 'Science'], skills: ['Robotics', 'Programming', 'Teaching'],
      achievements: ['WRO Kazakhstan — 3 место'], eventsCount: 10, role: 'Инженер', joined: '2025-10-28' },
    { id: 'u9', username: 'assel', name: 'Әсел Мұрат', city: 'Павлодар', school: 'Школа №34', grade: '10 класс',
      bio: 'Пишу тексты и учу одноклассников делать презентации без «стены текста».',
      interests: ['Education', 'Business'], skills: ['Copywriting', 'Teaching', 'Public Speaking'],
      achievements: ['Победитель эссе-конкурса Bilim'], eventsCount: 3, role: 'Автор', joined: '2026-04-16' },
  ];

  /* ------------------------------ Проекты ------------------------------- */
  const projects = [
    { id: 'p1', title: 'EcoQala', summary: 'Школьная система раздельного сбора мусора с картой пунктов приёма и рейтингом классов.',
      problem: 'В школах Алматы нет понятной системы раздельного сбора: контейнеры есть не везде, а ученики не знают, куда девать батарейки и пластик.',
      solution: 'Ставим брендированные боксы, подключаем карту пунктов приёма и запускаем рейтинг классов с ежемесячным награждением.',
      goal: 'Подключить 20 школ Алматы до конца учебного года и вывезти 3 тонны вторсырья.',
      category: 'Environment', stage: 'Active', city: 'Алматы', format: 'offline', lang: 'ru',
      skills: ['Marketing', 'Design', 'Public Speaking'], teamSize: 6, needTeam: true,
      links: [{ label: 'Инстаграм проекта', url: 'https://instagram.com' }],
      ownerId: 'u4', members: [{ userId: 'u4', role: 'Founder' }, { userId: 'u3', role: 'Designer' }, { userId: 'u7', role: 'SMM' }],
      createdAt: '2026-02-12' },

    { id: 'p2', title: 'Bilim Map', summary: 'Карта олимпиад, грантов и конкурсов Казахстана с напоминаниями о дедлайнах.',
      problem: 'Информация о возможностях разбросана по десяткам чатов и сайтов — школьники узнают о дедлайнах, когда уже поздно.',
      solution: 'Единый каталог с фильтрами по классу, предмету и городу плюс телеграм-напоминания за неделю до дедлайна.',
      goal: 'Собрать 500 актуальных возможностей и 5 000 подписчиков на напоминания.',
      category: 'Education', stage: 'MVP', city: 'Астана', format: 'online', lang: 'ru',
      skills: ['Programming', 'Research', 'SMM'], teamSize: 5, needTeam: true,
      links: [{ label: 'Прототип', url: 'https://example.kz' }],
      ownerId: 'u2', members: [{ userId: 'u2', role: 'Founder' }, { userId: 'u6', role: 'Developer' }, { userId: 'u9', role: 'Content' }],
      createdAt: '2026-01-20' },

    { id: 'p3', title: 'AquaSense', summary: 'Недорогой датчик качества воды для школьных лабораторий и дворовых колонок.',
      problem: 'Жители микрорайонов не знают состав воды из колонок, а лабораторный анализ стоит дорого и делается неделями.',
      solution: 'Собираем датчик на Arduino (pH, мутность, TDS) и открытую карту замеров, которую пополняют школьные команды.',
      goal: 'Выпустить 30 датчиков и собрать 1 000 замеров по Карагандинской области.',
      category: 'Science', stage: 'Development', city: 'Караганда', format: 'hybrid', lang: 'ru',
      skills: ['Robotics', 'Data', 'Research'], teamSize: 4, needTeam: true, links: [],
      ownerId: 'u5', members: [{ userId: 'u5', role: 'Founder' }, { userId: 'u8', role: 'Developer' }],
      createdAt: '2026-03-02' },

    { id: 'p4', title: 'Tulpar Robotics', summary: 'Школьная команда робототехники: собираем манипулятор и учим младшие классы основам.',
      problem: 'Кружки робототехники есть в трёх школах города, а желающих — сотни. Оборудование простаивает без наставников.',
      solution: 'Команда старшеклассников ведёт субботние занятия и собирает открытые методички для учителей.',
      goal: 'Обучить 120 учеников 5–7 классов и выйти на WRO Kazakhstan.',
      category: 'Technology', stage: 'Active', city: 'Алматы', format: 'offline', lang: 'kz',
      skills: ['Robotics', 'Teaching', 'Programming'], teamSize: 8, needTeam: false, links: [],
      ownerId: 'u8', members: [{ userId: 'u8', role: 'Founder' }, { userId: 'u2', role: 'Developer' }, { userId: 'u9', role: 'Content' }],
      createdAt: '2025-11-05' },

    { id: 'p5', title: 'MUN Academy', summary: 'Бесплатная школа делегатов MUN: 6 недель подготовки, разбор резолюций и тренировочные сессии.',
      problem: 'Новичкам страшно идти на первую конференцию: непонятны правила процедуры, position paper и формат дебатов.',
      solution: 'Курс из шести онлайн-встреч с менторами-делегатами и финальной тренировочной конференцией.',
      goal: 'Подготовить 100 делегатов из регионов к весеннему сезону конференций.',
      category: 'Education', stage: 'MVP', city: 'Онлайн', format: 'online', lang: 'en',
      skills: ['Public Speaking', 'Research', 'Teaching'], teamSize: 7, needTeam: true, links: [],
      ownerId: 'u1', members: [{ userId: 'u1', role: 'Founder' }, { userId: 'u9', role: 'Content' }],
      createdAt: '2026-04-01' },

    { id: 'p6', title: 'SATU Market', summary: 'Маркетплейс школьных мастеров: хендмейд, репетиторство и дизайн-услуги внутри школы.',
      problem: 'Ученики делают крутые вещи и услуги, но продают их случайно — через сторис и знакомых.',
      solution: 'Витрина с профилями, отзывами и безопасной оплатой через школьный совет.',
      goal: 'Запустить пилот в 3 школах и провести 200 сделок за семестр.',
      category: 'Business', stage: 'Idea', city: 'Шымкент', format: 'hybrid', lang: 'ru',
      skills: ['Business', 'Marketing', 'Programming', 'Design'], teamSize: 5, needTeam: true, links: [],
      ownerId: 'u4', members: [{ userId: 'u4', role: 'Founder' }],
      createdAt: '2026-06-18' },

    { id: 'p7', title: 'Qazaq Type', summary: 'Открытый шрифт с полной поддержкой казахской латиницы и кириллицы для школьных проектов.',
      problem: 'Половина бесплатных шрифтов ломается на ә, ө, ұ — школьные презентации и сайты выглядят неаккуратно.',
      solution: 'Рисуем шрифт из двух начертаний и выкладываем под открытой лицензией с гайдом по применению.',
      goal: 'Выпустить релиз 1.0 и 1 000 скачиваний.',
      category: 'Design', stage: 'Development', city: 'Алматы', format: 'online', lang: 'kz',
      skills: ['Design', 'Copywriting'], teamSize: 3, needTeam: true, links: [],
      ownerId: 'u3', members: [{ userId: 'u3', role: 'Founder' }, { userId: 'u9', role: 'Content' }],
      createdAt: '2026-05-09' },

    { id: 'p8', title: 'Dos Support', summary: 'Пиринговая поддержка: обученные волонтёры-старшеклассники и понятный маршрут к школьному психологу.',
      problem: 'Подростку проще написать ровеснику, чем зайти в кабинет психолога, — но у ровесника нет ни подготовки, ни протокола.',
      solution: 'Обучаем волонтёров базовым навыкам поддержки и делаем анонимный чат с чёткой передачей случая специалисту.',
      goal: 'Обучить 40 волонтёров и закрыть первые 300 обращений с обратной связью.',
      category: 'Social', stage: 'Development', city: 'Астана', format: 'hybrid', lang: 'ru',
      skills: ['Research', 'Public Speaking', 'Design'], teamSize: 6, needTeam: true, links: [],
      ownerId: 'u1', members: [{ userId: 'u1', role: 'Founder' }, { userId: 'u5', role: 'Researcher' }],
      createdAt: '2026-05-27' },

    { id: 'p9', title: 'Sabaq Reels', summary: 'Короткие видеоуроки по сложным темам школьной программы на казахском языке.',
      problem: 'Объяснений по физике и химии на казахском в коротком формате почти нет — ученики смотрят чужие языки и теряют смысл.',
      solution: 'Команда снимает по три ролика в неделю с учителями-консультантами и проверяет понимание квизом.',
      goal: '60 роликов и 50 000 просмотров за учебный год.',
      category: 'Education', stage: 'Active', city: 'Актобе', format: 'online', lang: 'kz',
      skills: ['Video', 'SMM', 'Teaching'], teamSize: 4, needTeam: true, links: [],
      ownerId: 'u7', members: [{ userId: 'u7', role: 'Founder' }, { userId: 'u3', role: 'Designer' }],
      createdAt: '2026-07-14' },
  ];

  /* ---------------------------- Мероприятия ----------------------------- */
  const events = [
    { id: 'e1', title: 'Almaty School Hackathon', type: 'hackathon', date: '2026-10-11', deadline: '2026-10-05',
      format: 'offline', place: 'Алматы, Tech Garden', org: 'Almaty Tech Garden',
      about: '36 часов на прототип продукта для города. Команды 3–5 человек, менторы из IT-компаний, призовой фонд 1 500 000 ₸.' },
    { id: 'e2', title: 'MEDEU MUN 2026', type: 'mun', date: '2026-11-14', deadline: '2026-10-25',
      format: 'offline', place: 'Алматы', org: 'MEDEU MUN',
      about: 'Шесть комитетов, три рабочих языка, два дня работы. Открыт набор делегатов и председателей.' },
    { id: 'e3', title: 'Республиканская олимпиада по информатике', type: 'olympiad', date: '2026-12-02', deadline: '2026-11-10',
      format: 'offline', place: 'Астана', org: 'МОН РК',
      about: 'Отборочный и основной туры. Задачи уровня IOI, допуск с 8 класса по результатам областного этапа.' },
    { id: 'e4', title: 'BASTAU Demo Day', type: 'contest', date: '2026-10-25', deadline: '2026-10-18',
      format: 'hybrid', place: 'Астана + онлайн', org: 'BASTAU',
      about: 'Питч-сессия проектов платформы: 5 минут на выступление, обратная связь от менторов и инвесторов.' },
    { id: 'e5', title: 'Мастер-класс: как питчить проект за 3 минуты', type: 'workshop', date: '2026-10-04', deadline: '2026-10-03',
      format: 'online', place: 'Zoom', org: 'BASTAU Mentors',
      about: 'Структура питча, работа с волнением и разбор выступлений участников в прямом эфире.' },
    { id: 'e6', title: 'Вебинар: как собрать команду и не развалиться', type: 'webinar', date: '2026-10-18', deadline: '2026-10-17',
      format: 'online', place: 'YouTube Live', org: 'BASTAU',
      about: 'Роли в команде, распределение задач, договорённости на берегу и что делать, когда кто-то пропал.' },
    { id: 'e7', title: 'NIS Science Fair', type: 'conference', date: '2026-11-29', deadline: '2026-11-01',
      format: 'offline', place: 'Караганда', org: 'НИШ',
      about: 'Ярмарка исследовательских проектов: стендовые сессии, постеры и защита перед жюри из вузов.' },
  ];

  /* ------------------------------ Менторы ------------------------------- */
  const mentors = [
    { id: 'm1', name: 'Асель Жумабекова', spec: 'Research & MUN', exp: '8 лет в международных программах',
      skills: ['Research', 'Public Speaking'], city: 'Алматы',
      bio: 'Готовила делегатов к THIMUN и Harvard MUN. Помогаю выстроить исследование и защитить позицию.',
      wins: ['50+ подготовленных делегатов', 'Судья 12 конференций'] },
    { id: 'm2', name: 'Нурлан Сериков', spec: 'Product & Startup', exp: 'Product manager, 6 лет',
      skills: ['Business', 'Marketing'], city: 'Астана',
      bio: 'Разбираю идеи на гипотезы: кому нужно, как проверить за неделю и что показать на демо-дне.',
      wins: ['Ментор Astana Hub', '3 выпущенных продукта'] },
    { id: 'm3', name: 'Мадина Ахметова', spec: 'Design & Brand', exp: 'Art-director, 7 лет',
      skills: ['Design', 'SMM'], city: 'Алматы',
      bio: 'Помогаю командам сделать так, чтобы проект выглядел взросло: логотип, интерфейс, презентация.',
      wins: ['Red Dot shortlist 2024', 'Ведёт курс по UI в KBTU'] },
    { id: 'm4', name: 'Ерлан Тулегенов', spec: 'Engineering & Robotics', exp: 'Инженер-разработчик, 10 лет',
      skills: ['Programming', 'Robotics', 'Data'], city: 'Караганда',
      bio: 'Довожу школьные прототипы до рабочих устройств: схемотехника, код, испытания.',
      wins: ['Тренер сборной WRO', '15 наставляемых команд'] },
  ];

  const applications = [
    { id: 'a1', projectId: 'p2', userId: 'u3', message: 'Могу сделать интерфейс каталога и иконки категорий. Есть опыт в Figma.', status: 'pending', createdAt: '2026-09-22' },
    { id: 'a2', projectId: 'p1', userId: 'u9', message: 'Напишу тексты для соцсетей и методичку для классных руководителей.', status: 'pending', createdAt: '2026-09-24' },
    { id: 'a3', projectId: 'p5', userId: 'u2', message: 'Хочу помочь с платформой для записи на сессии.', status: 'accepted', createdAt: '2026-09-10' },
  ];

  window.BASTAU = {
    VERSION: 'bastau.v1',
    CATEGORIES, STAGES, SKILLS, SKILLS_RU, ROLES, CITIES, FORMATS, LANGS, EVENT_TYPES, REPORT_REASONS,
    seed: () => JSON.parse(JSON.stringify({
      users, projects, events, mentors, applications,
      notifications: [], reports: [], session: null,
    })),
  };
})();
