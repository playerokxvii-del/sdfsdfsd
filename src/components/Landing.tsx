import {
  Bot, Shield, CreditCard, Star, MessageSquare,
  Globe, Database, Layers, Zap, Code2, ArrowRight
} from 'lucide-react';

interface LandingProps {
  onShowCode: () => void;
}

export function Landing({ onShowCode }: LandingProps) {
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Безопасная регистрация',
      description: 'Регистрация через номер телефона с FSM-сценарием. Защита данных пользователей.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Система сделок',
      description: 'Создание сделок с deep-link. Покупатель переходит по ссылке и видит карточку товара.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: 'Рейтинг и доверие',
      description: 'Автоматический расчёт рейтинга на основе успешных сделок. Статистика доверия.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Мультивалютность',
      description: 'Автоматическая конвертация цен в 5 валют: RUB, USD, EUR, UAH, KZT.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Поддержка и модерация',
      description: 'Встроенная система поддержки. Модератор одобряет пополнения и решает споры.',
      color: 'from-red-500 to-rose-500',
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'SQLite база данных',
      description: 'Надёжное хранение данных через aiosqlite. Таблицы users, deals, topups.',
      color: 'from-indigo-500 to-violet-500',
    },
  ];

  const techStack = [
    { name: 'aiogram 3.x', desc: 'Async Telegram Bot Framework' },
    { name: 'aiosqlite', desc: 'Асинхронный SQLite' },
    { name: 'FSM', desc: 'Finite State Machine' },
    { name: 'Deep Links', desc: 'Ссылки на сделки' },
    { name: 'HTML Parse', desc: 'Красивые сообщения' },
    { name: 'Inline KB', desc: 'Интерактивные кнопки' },
  ];

  return (
    <div className="flex-1 overflow-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8">
            <Bot className="w-4 h-4" />
            Telegram Bot • Python • Production Ready
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              PLAYEROK
            </span>
            <br />
            <span className="text-white">Market Bot</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Полноценный Telegram-бот маркетплейса для покупки и продажи игровых товаров.
            Готовый к продакшену код с модульной архитектурой.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onShowCode}
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-105"
            >
              <Code2 className="w-5 h-5" />
              Смотреть исходный код
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4 text-white">
          🚀 Возможности бота
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
          Полный набор функций для работы маркетплейса в Telegram
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-[#161b22] border border-gray-800 hover:border-purple-500/30 transition-all hover:shadow-lg hover:shadow-purple-500/5"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4 text-white">
          ⚙️ Технический стек
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
          Современный асинхронный стек для максимальной производительности
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {techStack.map((tech, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#161b22] border border-gray-800 text-center hover:border-blue-500/30 transition-all"
            >
              <Zap className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-white">{tech.name}</h4>
              <p className="text-xs text-gray-500 mt-1">{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4 text-white">
          🏗 Архитектура проекта
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
          Модульная структура с разделением ответственности
        </p>

        <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 font-mono text-sm">
          <div className="text-gray-400">
            <div className="text-purple-400 mb-2">playerok-bot/</div>
            <div className="ml-4 space-y-1">
              <div><span className="text-yellow-400">├──</span> <span className="text-green-400">bot.py</span> <span className="text-gray-600">— Точка входа, диспетчер</span></div>
              <div><span className="text-yellow-400">├──</span> <span className="text-green-400">config.py</span> <span className="text-gray-600">— Токены, ID, курсы валют</span></div>
              <div><span className="text-yellow-400">├──</span> <span className="text-green-400">database.py</span> <span className="text-gray-600">— SQLite (aiosqlite)</span></div>
              <div><span className="text-yellow-400">├──</span> <span className="text-green-400">utils.py</span> <span className="text-gray-600">— Утилиты, баннеры</span></div>
              <div><span className="text-yellow-400">├──</span> <span className="text-blue-400">banner.jpg</span> <span className="text-gray-600">— Баннер для сообщений</span></div>
              <div><span className="text-yellow-400">├──</span> <span className="text-blue-300">handlers/</span></div>
              <div className="ml-8">
                <div><span className="text-yellow-400">├──</span> <span className="text-green-400">start.py</span> <span className="text-gray-600">— /start, регистрация</span></div>
                <div><span className="text-yellow-400">├──</span> <span className="text-green-400">menu.py</span> <span className="text-gray-600">— Меню, профиль, поддержка</span></div>
                <div><span className="text-yellow-400">├──</span> <span className="text-green-400">deals.py</span> <span className="text-gray-600">— Сделки, покупка</span></div>
                <div><span className="text-yellow-400">└──</span> <span className="text-green-400">payments.py</span> <span className="text-gray-600">— Пополнение, модерация</span></div>
              </div>
              <div><span className="text-yellow-400">├──</span> <span className="text-blue-300">keyboards/</span></div>
              <div className="ml-8">
                <div><span className="text-yellow-400">└──</span> <span className="text-green-400">inline.py</span> <span className="text-gray-600">— Все клавиатуры</span></div>
              </div>
              <div><span className="text-yellow-400">├──</span> <span className="text-blue-300">states/</span></div>
              <div className="ml-8">
                <div><span className="text-yellow-400">└──</span> <span className="text-green-400">states.py</span> <span className="text-gray-600">— FSM состояния</span></div>
              </div>
              <div><span className="text-yellow-400">└──</span> <span className="text-blue-300">texts/</span></div>
              <div className="ml-8">
                <div><span className="text-yellow-400">└──</span> <span className="text-green-400">messages.py</span> <span className="text-gray-600">— Все тексты</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bot Flow */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4 text-white">
          📋 Сценарии работы
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
          Основные пользовательские сценарии бота
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#161b22] border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold">1</div>
              <h3 className="font-semibold text-white">Регистрация</h3>
            </div>
            <div className="text-sm text-gray-400 space-y-2">
              <p>→ /start → Отправка контакта → Ввод никнейма → Готово!</p>
              <p className="text-xs text-gray-600">FSM: waiting_for_phone → waiting_for_nickname</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#161b22] border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold">2</div>
              <h3 className="font-semibold text-white">Создание сделки</h3>
            </div>
            <div className="text-sm text-gray-400 space-y-2">
              <p>→ Проверка подписки → Категория → Название → Описание → Цена → Ссылка!</p>
              <p className="text-xs text-gray-600">Генерация deep-link: t.me/bot?start=deal_UUID</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#161b22] border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">3</div>
              <h3 className="font-semibold text-white">Покупка товара</h3>
            </div>
            <div className="text-sm text-gray-400 space-y-2">
              <p>→ Переход по ссылке → Карточка товара → Оплата → Ожидание → Подтверждение</p>
              <p className="text-xs text-gray-600">Деньги замораживаются до подтверждения получения</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#161b22] border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-sm font-bold">4</div>
              <h3 className="font-semibold text-white">Пополнение баланса</h3>
            </div>
            <div className="text-sm text-gray-400 space-y-2">
              <p>→ Реквизиты → Ввод суммы → Подтверждение → Модератор → Зачисление</p>
              <p className="text-xs text-gray-600">Ручная модерация для безопасности</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center">
        <p className="text-gray-500 text-sm">
          🎮 PLAYEROK Market Bot • Полный исходный код на Python
        </p>
        <p className="text-gray-600 text-xs mt-2">
          aiogram 3.x • aiosqlite • FSM • Deep Links • Inline Keyboards
        </p>
      </footer>
    </div>
  );
}
