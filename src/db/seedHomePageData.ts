import { db } from './connection';
import type { NewSection } from './schema/schema';
import { sections } from './schema/schema';

/**
 * Данные для главной страницы
 * Запускается при инициализации для заполнения таблицы sections начальными данными, если она пустая
 * Каждый компонент имеет title, description, content (в виде JSON строки) и componentType для определения типа компонента на фронте
 */
export async function seedHomePageData(): Promise<void> {
  try {
    // Проверяем, есть ли уже данные в таблице sections
    const existingComponents = await db.select().from(sections).limit(1);

    if (existingComponents.length > 0) {
      return;
    }

    const now = new Date();

    const sampleSections: NewSection[] = [
      {
        title: 'hero-section',
        description: 'hero-section',
        content: JSON.stringify({
          subHeader: 'Быстрый старт',
          header: 'Мгновенный IDE в браузере',
          subtitle:
            'Пишите и запускайте код без установки конфигурации. Делитесь сниппетами, подключайте песочницы и встраваивайте в документацию.',
          content: [
            {
              id: 1,
              title: 'Запуск за секунды',
              textContent: 'Откройте и пишите - все готово',
            },
            {
              id: 2,
              title: 'Виджеты',
              textContent: 'Встраивайте интерактивные примеры',
            },
            {
              id: 3,
              title: 'Шаринг',
              textContent: 'Делитесь ссылкой или встраивайте статьи',
            },
          ],
          CTA: '',
        }),
        componentType: 'hero',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'features-section',
        description: 'features-section',
        content: JSON.stringify({
          features: [
            {
              id: 1,
              title: 'Песочницы',
              textContent: 'Окружения для JS, TS, Python, SQL и др.',
              icon: 'BeakerIcon',
            },
            {
              id: 2,
              title: 'Редактор',
              textContent: 'Легкий и быстрый, сохранение в один клик.',
              icon: 'ClipboardIcon',
            },
            {
              id: 3,
              title: 'Встраивание',
              textContent:
                'HTML-виджет и React-компонент для любой документации.',
              icon: 'LinkIcon',
            },
            {
              id: 4,
              title: 'Проверки',
              textContent: 'Добавляйте тесты к задачам и урокам.',
              icon: 'CheckIcon',
            },
            {
              id: 5,
              title: 'API',
              textContent: 'Запускайте код из своих приложений.',
              icon: 'BriefcaseIcon',
            },
            {
              id: 6,
              title: 'Команда',
              textContent: 'Совместная работа и общий доступ',
              icon: 'UsersIcon',
            },
          ],
        }),
        componentType: 'features',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'technologies-section',
        description: 'technologies-section',
        content: JSON.stringify({
          technologies: [
            {
              category: 'Языки',
              items: [
                'JavaScript',
                'TypeScript',
                'Python',
                'Go',
                'Rust',
                'C',
                'C++',
                'PHP',
                'Ruby',
              ],
            },
            {
              category: 'Базы данных',
              items: [
                'PostgreSQL',
                'MySQL',
                'SQLite',
                'MongoDB',
                'Redis',
                'ClickHouse',
              ],
            },
            {
              category: 'Инструменты',
              items: ['Git', 'grep', 'curl', 'Mermaid', 'Latex'],
            },
          ],
        }),
        componentType: 'technologies',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'community-section',
        description: 'community-section',
        content: JSON.stringify({
          communities: [
            {
              badge: '+1k каждый месяц',
              btn: 'Перейти в канал',
              link: 'https://t.me/HexletCareerBot',
              text: 'Обсуждение вакансий и резюме',
              title: 'Тг Карьера',
            },
            {
              badge: 'Активные обсуждения',
              btn: 'Присоединиться',
              link: 'https://t.me/hexletcommunity',
              text: 'Вопросы по коду и обмен опытом',
              title: 'Тг Сообщество',
            },
            {
              badge: 'Закрытый клуб',
              btn: 'Узнать подробнее',
              link: 'https://t.me/HexletClubBot',
              text: 'Нетворкинг и коллаборации',
              title: 'Клуб Хекслета',
            },
          ],
        }),
        componentType: 'community',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'call-to-action-section',
        description: 'call-to-action-section',
        content: JSON.stringify({
          textContent: {
            title: 'Готовы попробовать?',
            subtitle: 'Начните бесплатно. Без установки и регистрации.',
          },
        }),
        componentType: 'cta',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const _inserted = await db
      .insert(sections)
      .values(sampleSections)
      .returning();
  } catch (error) {
    console.error('Error seeding home page data:', error);
    throw error;
  }
}
