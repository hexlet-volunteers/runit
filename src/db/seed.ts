import { db } from './connection';
import { sections } from './schema/schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Starting seeding...');

  const sectionsData = [
    {
      title: 'hero-section',
      description: 'hero-section',
      content: JSON.stringify({
        title: 'Мгновенный IDE в браузере',
        subtitle: 'Пишите и запускайте код без установки и конфигурации. Делитесь ссылками, подключайте песочницы и встраивайте в документацию.',
        subtitle2: 'Быстрый старт',
        items: [
          {
            id: 1,
            title: 'Запуск за секунды',
            textContent: 'Откройте и пишите - все готово'
          },
          {
            id: 2,
            title: 'Виджеты',
            textContent: 'Встраивайте интерактивные примеры'
          },
          {
            id: 3,
            title: 'Шаринг',
            textContent: 'Делитесь ссылкой или встраивайте статьи'
          }
        ]
      })
    },
    {
      title: 'features-section',
      description: 'features-section',
      content: JSON.stringify({
        title: 'Что умеет RunIT',
        items: [
          {
            id: 1,
            title: 'Песочницы',
            textContent: 'Окружения для JS, TS, Python, SQL и др.'
          },
          {
            id: 2,
            title: 'Редактор',
            textContent: 'Легкий и быстрый, сохранение в один клик.'
          },
          {
            id: 3,
            title: 'Встраивание',
            textContent: 'HTML-виджет и React-компонент для любой документации.'
          },
          {
            id: 4,
            title: 'Проверки',
            textContent: 'Добавляйте тесты к задачам и урокам.'
          },
          {
            id: 5,
            title: 'API',
            textContent: 'Запускайте код из своих приложений.'
          },
          {
            id: 6,
            title: 'Команда',
            textContent: 'Совместная работа и общий доступ'
          }
        ]
      })
    },
    {
      title: 'technologies-section',
      description: 'technologies-section',
      content: JSON.stringify({
        title: 'Технологии',
        subtitle: 'Поддержка популярных языков, баз данных и инструментов',
        items: [
          {
            id: 1,
            title: 'Языки',
            textContent: ['JavaScript, TypeScript, Python, Go, Rust, C, C++, PHP, Java, Ruby']
          },
          {
            id: 2,
            title: 'Базы данных',
            textContent: ['PostgreSQL, MySQL, SQLite, MongoDB, Redis, Clickhouse']
          },
          {
            id: 3,
            title: 'Инструменты',
            textContent: ['Git, grep, curl, Mermaid, LaTeX']
          }
        ]
      })
    },
    {
      title: 'community-section',
      description: 'community-section',
      content: JSON.stringify({
        title: 'Join the Community',
        subtitle: 'RunIT — растущее сообщество разработчиков. Присоединяйтесь к нашим каналам и оставайтесь в курсе новостей.',
        items: [
          {
            id: 1,
            title: 'Tг Карьера',
            textContent: 'Обсуждаем вакансии и резюме',
            button: 'Перейти в канал'
          },
          {
            id: 2,
            title: 'Tг Сообщество',
            textContent: 'Вопросы по коду и обмен опытом',
            button: 'Присоединиться'
          },
          {
            id: 3,
            title: 'Клуб Хекслета',
            textContent: 'Нетворкинг и коллаборации',
            button: 'Узнать подробнее'
          }
        ]
      })
    },
    {
      title: 'call-to-action-section',
      description: 'call-to-action-section',
      content: JSON.stringify({
        title: 'Готовы попробовать?',
        subtitle: 'Начните бесплатно. Без установки и регистрации.',
        buttons: [
          {
            id: 1,
            textContent: 'Открыть IDE'
          },
          {
            id: 2,
            textContent: 'Документация'
          }
        ]
      })
    }
  ];

  try {
    for (const section of sectionsData) {
      const existing = await db
        .select()
        .from(sections)
        .where(eq(sections.title, section.title));

      if (existing.length > 0) {
        console.log(`⏭️  Section "${section.title}" already exists, skipping...`);
        continue;
      }

      await db.insert(sections).values(section);
      console.log(`Inserted section: ${section.title}`);
    }

    console.log('Seeding completed!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });