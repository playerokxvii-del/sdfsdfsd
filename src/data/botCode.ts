export interface BotFile {
  path: string;
  name: string;
  language: string;
  description: string;
  code: string;
}

export const botFiles: BotFile[] = [
  {
    path: "config.py",
    name: "config.py",
    language: "python",
    description: "Конфигурация бота: токены, ID, курсы валют",
    code: `"""
Конфигурация бота PLAYEROK Market
"""

# Токен бота (получить у @BotFather)
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

# ID модератора (для уведомлений о пополнении и поддержке)
MODERATOR_ID = 6930148555

# ID группы/канала для обязательной подписки
REQUIRED_CHANNEL_ID = -1004364039216

# Username бота (для генерации deep-link)
BOT_USERNAME = "your_bot_username"

# Ссылка на группу (для кнопки подписки)
CHANNEL_URL = "https://t.me/your_channel"

# Курсы валют (заглушки)
CURRENCY_RATES = {
    "RUB": 1.0,
    "USD": 1 / 90,      # 1 RUB = ~0.011 USD
    "EUR": 1 / 100,     # 1 RUB = ~0.01 EUR
    "UAH": 0.4,         # 1 RUB = ~0.4 UAH
    "KZT": 5.0,         # 1 RUB = ~5 KZT
}

# Символы валют
CURRENCY_SYMBOLS = {
    "RUB": "₽",
    "USD": "$",
    "EUR": "€",
    "UAH": "₴",
    "KZT": "₸",
}

# Флаги стран
CURRENCY_FLAGS = {
    "RUB": "🇷🇺",
    "USD": "🇺🇸",
    "EUR": "🇪🇺",
    "UAH": "🇺🇦",
    "KZT": "🇰🇿",
}

# Реквизиты для пополнения
TOPUP_BANK = "Сбербанк"
TOPUP_PHONE = "7 927 817 1305"
TOPUP_RECEIVER = "Мария Е."

# Путь к баннеру
BANNER_PATH = "banner.jpg"
`
  },
  {
    path: "database.py",
    name: "database.py",
    language: "python",
    description: "Работа с базой данных SQLite (aiosqlite)",
    code: `"""
Модуль работы с базой данных SQLite
"""

import aiosqlite
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = "playerok_market.db"


async def init_db():
    """Создание таблиц при первом запуске"""
    async with aiosqlite.connect(DB_PATH) as db:
        # Таблица пользователей
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                phone TEXT,
                nickname TEXT,
                balance REAL DEFAULT 0.0,
                rating_sum REAL DEFAULT 0.0,
                rating_count INTEGER DEFAULT 0,
                successful_deals INTEGER DEFAULT 0,
                failed_deals INTEGER DEFAULT 0,
                is_registered BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Таблица сделок
        await db.execute("""
            CREATE TABLE IF NOT EXISTS deals (
                deal_id TEXT PRIMARY KEY,
                seller_id INTEGER,
                category TEXT,
                title TEXT,
                description TEXT,
                price_rub REAL,
                status TEXT DEFAULT 'active',
                buyer_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (seller_id) REFERENCES users(user_id),
                FOREIGN KEY (buyer_id) REFERENCES users(user_id)
            )
        """)

        # Таблица пополнений
        await db.execute("""
            CREATE TABLE IF NOT EXISTS topups (
                topup_id TEXT PRIMARY KEY,
                user_id INTEGER,
                amount REAL,
                status TEXT DEFAULT 'waiting',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)

        await db.commit()


async def create_user(user_id: int, phone: str, nickname: str) -> bool:
    """Создание нового пользователя"""
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            await db.execute(
                """INSERT INTO users (user_id, phone, nickname, is_registered)
                   VALUES (?, ?, ?, ?)""",
                (user_id, phone, nickname, True)
            )
            await db.commit()
            return True
        except Exception:
            return False


async def get_user(user_id: int) -> Optional[Dict[str, Any]]:
    """Получение данных пользователя"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM users WHERE user_id = ?", (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
            return None


async def is_registered(user_id: int) -> bool:
    """Проверка регистрации пользователя"""
    user = await get_user(user_id)
    return user is not None and bool(user.get("is_registered"))


async def update_balance(user_id: int, amount: float):
    """Обновление баланса пользователя"""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE users SET balance = balance + ? WHERE user_id = ?",
            (amount, user_id)
        )
        await db.commit()


async def get_balance(user_id: int) -> float:
    """Получение баланса пользователя"""
    user = await get_user(user_id)
    return user["balance"] if user else 0.0


async def create_deal(seller_id: int, category: str, title: str,
                      description: str, price_rub: float) -> str:
    """Создание новой сделки, возврат deal_id"""
    deal_id = str(uuid.uuid4())
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO deals (deal_id, seller_id, category, title,
               description, price_rub, status)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (deal_id, seller_id, category, title, description, price_rub, "active")
        )
        await db.commit()
    return deal_id


async def get_deal(deal_id: str) -> Optional[Dict[str, Any]]:
    """Получение сделки по ID"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM deals WHERE deal_id = ?", (deal_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
            return None


async def update_deal_status(deal_id: str, status: str, buyer_id: int = None):
    """Обновление статуса сделки"""
    async with aiosqlite.connect(DB_PATH) as db:
        if buyer_id:
            await db.execute(
                "UPDATE deals SET status = ?, buyer_id = ? WHERE deal_id = ?",
                (status, buyer_id, deal_id)
            )
        else:
            await db.execute(
                "UPDATE deals SET status = ? WHERE deal_id = ?",
                (status, deal_id)
            )
        await db.commit()


async def get_user_deals(user_id: int) -> List[Dict[str, Any]]:
    """Получение всех сделок пользователя (как продавец или покупатель)"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """SELECT * FROM deals WHERE seller_id = ? OR buyer_id = ?
               ORDER BY created_at DESC""",
            (user_id, user_id)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


async def create_topup(user_id: int, amount: float) -> str:
    """Создание записи о пополнении"""
    topup_id = str(uuid.uuid4())
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO topups (topup_id, user_id, amount, status)
               VALUES (?, ?, ?, ?)""",
            (topup_id, user_id, amount, "waiting")
        )
        await db.commit()
    return topup_id


async def update_topup_status(topup_id: str, status: str):
    """Обновление статуса пополнения"""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE topups SET status = ? WHERE topup_id = ?",
            (status, topup_id)
        )
        await db.commit()


async def get_topup(topup_id: str) -> Optional[Dict[str, Any]]:
    """Получение записи о пополнении"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM topups WHERE topup_id = ?", (topup_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
            return None


async def update_rating(user_id: int, rating_value: float):
    """Обновление рейтинга пользователя"""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """UPDATE users SET rating_sum = rating_sum + ?,
               rating_count = rating_count + 1 WHERE user_id = ?""",
            (rating_value, user_id)
        )
        await db.commit()


async def increment_deals(user_id: int, success: bool):
    """Увеличение счётчика сделок"""
    async with aiosqlite.connect(DB_PATH) as db:
        if success:
            await db.execute(
                "UPDATE users SET successful_deals = successful_deals + 1 WHERE user_id = ?",
                (user_id,)
            )
        else:
            await db.execute(
                "UPDATE users SET failed_deals = failed_deals + 1 WHERE user_id = ?",
                (user_id,)
            )
        await db.commit()
`
  },
  {
    path: "states/states.py",
    name: "states/states.py",
    language: "python",
    description: "FSM состояния для всех сценариев бота",
    code: `"""
FSM Состояния бота PLAYEROK Market
"""

from aiogram.fsm.state import State, StatesGroup


class RegistrationStates(StatesGroup):
    """Состояния регистрации"""
    waiting_for_phone = State()
    waiting_for_nickname = State()


class DealCreationStates(StatesGroup):
    """Состояния создания сделки"""
    choosing_category = State()
    waiting_title = State()
    waiting_description = State()
    waiting_price = State()


class TopupStates(StatesGroup):
    """Состояния пополнения баланса"""
    waiting_topup_amount = State()
    waiting_topup_confirm = State()


class SupportStates(StatesGroup):
    """Состояния поддержки"""
    waiting_support_msg = State()
`
  },
  {
    path: "keyboards/inline.py",
    name: "keyboards/inline.py",
    language: "python",
    description: "Все клавиатуры бота (Inline и Reply)",
    code: `"""
Клавиатуры бота PLAYEROK Market
"""

from aiogram.types import (
    InlineKeyboardMarkup,
    ReplyKeyboardMarkup,
    KeyboardButton,
)
from aiogram.utils.keyboard import InlineKeyboardBuilder


def get_phone_keyboard() -> ReplyKeyboardMarkup:
    """Клавиатура с кнопкой отправки контакта"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Отправить мой номер", request_contact=True)]
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def get_main_menu_keyboard() -> InlineKeyboardMarkup:
    """Главное меню (Inline)"""
    builder = InlineKeyboardBuilder()
    builder.button(text="🛍 Создать сделку", callback_data="create_deal")
    builder.button(text="🔎 Поиск товаров", callback_data="search_goods")
    builder.button(text="💳 Мой баланс", callback_data="my_balance")
    builder.button(text="👤 Мой профиль", callback_data="my_profile")
    builder.button(text="📜 Мои сделки", callback_data="my_deals")
    builder.button(text="🆘 Поддержка", callback_data="support")
    builder.adjust(2)  # 2 кнопки в ряд
    return builder.as_markup()


def get_back_to_menu_keyboard() -> InlineKeyboardMarkup:
    """Кнопка возврата в меню"""
    builder = InlineKeyboardBuilder()
    builder.button(text="🔙 Вернуться в меню", callback_data="main_menu")
    return builder.as_markup()


def get_subscription_keyboard(channel_url: str) -> InlineKeyboardMarkup:
    """Клавиатура для проверки подписки"""
    builder = InlineKeyboardBuilder()
    builder.button(text="🔗 Подписаться", url=channel_url)
    builder.button(text="✅ Я подписался", callback_data="check_sub_again")
    builder.adjust(2)
    return builder.as_markup()


def get_category_keyboard() -> InlineKeyboardMarkup:
    """Выбор категории товара"""
    builder = InlineKeyboardBuilder()
    builder.button(text="🖼 NFT-Подарок", callback_data="cat_nft")
    builder.button(text="⚔️ Игровые аккаунты", callback_data="cat_accs")
    builder.button(text="💎 Внутриигровая валюта", callback_data="cat_currency")
    builder.button(text="🔑 Ключи/Промокоды", callback_data="cat_keys")
    builder.button(text="🚀 Буст/Услуги", callback_data="cat_boost")
    builder.adjust(1)  # Вертикально
    return builder.as_markup()


def get_deal_card_keyboard(deal_id: str, price_rub: float) -> InlineKeyboardMarkup:
    """Карточка товара для покупателя"""
    builder = InlineKeyboardBuilder()
    builder.button(
        text=f"💳 Купить за {price_rub:.0f} ₽",
        callback_data=f"buy_deal_{deal_id}"
    )
    builder.button(text="🔙 Назад", callback_data="main_menu")
    builder.adjust(1)
    return builder.as_markup()


def get_balance_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура раздела баланса"""
    builder = InlineKeyboardBuilder()
    builder.button(text="➕ Пополнить баланс", callback_data="topup_start")
    builder.button(text="🔙 Назад в меню", callback_data="main_menu")
    builder.adjust(1)
    return builder.as_markup()


def get_topup_confirm_keyboard(amount: float) -> InlineKeyboardMarkup:
    """Подтверждение пополнения"""
    builder = InlineKeyboardBuilder()
    builder.button(
        text="✅ Я отправил деньги",
        callback_data=f"confirm_topup_{amount:.0f}"
    )
    builder.button(text="❌ Отмена", callback_data="main_menu")
    builder.adjust(1)
    return builder.as_markup()


def get_topup_insufficient_keyboard() -> InlineKeyboardMarkup:
    """Недостаточно средств"""
    builder = InlineKeyboardBuilder()
    builder.button(text="💳 Пополнить баланс", callback_data="topup_start")
    builder.button(text="🔙 Назад в меню", callback_data="main_menu")
    builder.adjust(1)
    return builder.as_markup()


def get_buyer_after_purchase_keyboard(deal_id: str) -> InlineKeyboardMarkup:
    """Кнопки после покупки для покупателя"""
    builder = InlineKeyboardBuilder()
    builder.button(text="✅ Я получил товар", callback_data=f"confirm_receive_{deal_id}")
    builder.button(text="❌ Проблема, открыть спор", callback_data=f"dispute_{deal_id}")
    builder.adjust(1)
    return builder.as_markup()


def get_deals_list_keyboard(deals: list) -> InlineKeyboardMarkup:
    """Список сделок пользователя"""
    builder = InlineKeyboardBuilder()
    status_emoji = {
        "active": "🟢",
        "pending": "🟡",
        "completed": "✅",
        "cancelled": "❌",
    }
    for deal in deals:
        emoji = status_emoji.get(deal["status"], "⚪")
        builder.button(
            text=f"{emoji} {deal['title']} - {deal['status']}",
            callback_data=f"view_deal_{deal['deal_id']}"
        )
    builder.button(text="🔙 Назад в меню", callback_data="main_menu")
    builder.adjust(1)
    return builder.as_markup()


def get_no_deals_keyboard() -> InlineKeyboardMarkup:
    """Когда нет сделок"""
    builder = InlineKeyboardBuilder()
    builder.button(text="🛍 Создать сделку", callback_data="create_deal")
    builder.button(text="🔙 Назад в меню", callback_data="main_menu")
    builder.adjust(2)
    return builder.as_markup()


def get_moderator_topup_keyboard(topup_id: str, amount: float) -> InlineKeyboardMarkup:
    """Клавиатура для модератора (одобрение/отклонение пополнения)"""
    builder = InlineKeyboardBuilder()
    builder.button(
        text=f"✅ Зачислить {amount:.0f} ₽",
        callback_data=f"admin_approve_{topup_id}"
    )
    builder.button(text="❌ Отклонить", callback_data=f"admin_reject_{topup_id}")
    builder.adjust(2)
    return builder.as_markup()
`
  },
  {
    path: "texts/messages.py",
    name: "texts/messages.py",
    language: "python",
    description: "Все тексты сообщений бота (вынесены отдельно)",
    code: `"""
Все текстовые сообщения бота PLAYEROK Market
"""

# Разделитель
SEPARATOR = "▬▬▬▬▬▬▬▬▬▬▬▬▬▬"

# === РЕГИСТРАЦИЯ ===

WELCOME_MESSAGE = f"""<b>👋 Добро пожаловать в PLAYEROK Market!</b>

{SEPARATOR}

Для работы с маркетплейсом в целях безопасности необходимо пройти регистрацию.

👇 <b>Нажми кнопку ниже, чтобы поделиться контактом:</b>"""

PHONE_SAVED_MESSAGE = f"""<b>✅ Номер сохранён!</b>

{SEPARATOR}

Теперь придумай себе <b>Никнейм</b> (не @username, а просто имя, например: <i>CyberTrader</i>).

✍️ <b>Введи никнейм текстом:</b>"""

REGISTRATION_COMPLETE_MESSAGE = f"""<b>🎉 Регистрация завершена!</b>

{SEPARATOR}

Добро пожаловать в <b>PLAYEROK Market</b>, <i>{'{nickname}'}</i>!

Теперь тебе доступны все функции маркетплейса.
Удачных сделок! 🚀"""

# === ГЛАВНОЕ МЕНЮ ===

MAIN_MENU_MESSAGE = f"""<b>🔥 ГЛАВНОЕ МЕНЮ PLAYEROK 🔥</b>

{SEPARATOR}

👤 <b>Игрок:</b> {'{nickname}'}
💰 <b>Баланс:</b> {'{balance}'} ₽
⭐ <b>Рейтинг:</b> {'{rating}'}/5.0
✅ <b>Успешных сделок:</b> {'{success}'} | ❌ <b>Неудачных:</b> {'{fail}'}

{SEPARATOR}

🛒 <b>Выбери нужное действие:</b>"""

# === ПОДПИСКА ===

SUBSCRIPTION_REQUIRED = f"""<b>⚠️ Для создания сделок нужно быть в нашем канале!</b>

{SEPARATOR}

Подпишись на наш канал, чтобы получать уведомления о новых товарах и акциях.

👇 <b>Нажми "Подписаться" и затем "Я подписался":</b>"""

# === СОЗДАНИЕ СДЕЛКИ ===

CATEGORY_PROMPT = f"""<b>📦 Выбери категорию товара:</b>

{SEPARATOR}

<i>Выбери категорию, к которой относится твой товар:</i>"""

TITLE_PROMPTS = {
    "cat_nft": f"""<b>🖼 Продажа NFT-Подарка</b>

{SEPARATOR}

✍️ <b>Введи краткое название NFT</b> (например: <i>Halloween Ghost 2023</i>):""",

    "cat_accs": f"""<b>⚔️ Продажа игрового аккаунта</b>

{SEPARATOR}

✍️ <b>Введи название аккаунта</b> (например: <i>Акк Genshin AR60</i>):""",

    "cat_currency": f"""<b>💎 Продажа внутриигровой валюты</b>

{SEPARATOR}

✍️ <b>Введи название</b> (например: <i>1000 V-Bucks Fortnite</i>):""",

    "cat_keys": f"""<b>🔑 Продажа ключа/промокода</b>

{SEPARATOR}

✍️ <b>Введи название</b> (например: <i>Steam Key — Elden Ring</i>):""",

    "cat_boost": f"""<b>🚀 Продажа буста/услуги</b>

{SEPARATOR}

✍️ <b>Введи название услуги</b> (например: <i>Буст до Diamond в Valorant</i>):""",
}

DESCRIPTION_PROMPTS = {
    "cat_nft": f"""<b>📝 Теперь добавь описание.</b>

<i>💡 Подсказка для NFT: укажи сеть, ID контракта, редкость.</i>

👇 <b>Отправь текст описания:</b>""",

    "cat_accs": f"""<b>📝 Теперь добавь описание.</b>

<i>💡 Подсказка: укажи уровень, персонажей, скины, привязки.</i>

👇 <b>Отправь текст описания:</b>""",

    "cat_currency": f"""<b>📝 Теперь добавь описание.</b>

<i>💡 Подсказка: укажи количество валюты, способ передачи, игру.</i>

👇 <b>Отправь текст описания:</b>""",

    "cat_keys": f"""<b>📝 Теперь добавь описание.</b>

<i>💡 Подсказка: укажи платформу, регион, срок активации.</i>

👇 <b>Отправь текст описания:</b>""",

    "cat_boost": f"""<b>📝 Теперь добавь описание.</b>

<i>💡 Подсказка: укажи сроки, требования, гарантии.</i>

👇 <b>Отправь текст описания:</b>""",
}

PRICE_PROMPT = f"""<b>💵 Укажи стоимость товара в РУБЛЯХ (₽).</b>

<i>(Бот автоматически сконвертирует цену в 5 валют для покупателя)</i>

👇 <b>Введи число:</b>"""

PRICE_ERROR = """<b>❌ Ошибка!</b>

Введи <b>число</b> (стоимость в рублях).
Например: <code>500</code> или <code>1500</code>

👇 <b>Попробуй ещё раз:</b>"""

DEAL_CREATED_MESSAGE = f"""<b>✅ СДЕЛКА УСПЕШНО СОЗДАНА!</b>

{SEPARATOR}

📦 <b>Товар:</b> {'{title}'}
💰 <b>Цена:</b> {'{price_rub}'} ₽

🔗 <b>Твоя уникальная ссылка для покупателя:</b>
<code>https://t.me/{'{bot_username}'}?start=deal_{'{deal_id}'}</code>

👆 <i>Скопируй ссылку выше и отправь покупателю! Как только он перейдёт по ней, он увидит карточку товара и сможет оплатить.</i>"""

# === КАРТОЧКА ТОВАРА ===

DEAL_CARD_MESSAGE = f"""<b>🛒 ПРЕДЛОЖЕНИЕ О СДЕЛКЕ</b>

{SEPARATOR}

👤 <b>Продавец:</b> {'{seller_nickname}'}
⭐ <b>Рейтинг продавца:</b> {'{seller_rating}'}/5.0 ({'{seller_success}'} успешных)

{SEPARATOR}

📦 <b>Категория:</b> {'{category}'}
🏷 <b>Товар:</b> {'{title}'}
📝 <b>Описание:</b>
<i>{'{description}'}</i>

{SEPARATOR}

💵 <b>ЦЕНА ВО ВСЕХ ВАЛЮТАХ:</b>
🇷🇺 RUB: <b>{'{price_rub}'} ₽</b>
🇺🇸 USD: <b>{'{price_usd}'} $</b>
🇪🇺 EUR: <b>{'{price_eur}'} €</b>
🇺🇦 UAH: <b>{'{price_uah}'} ₴</b>
🇰🇿 KZT: <b>{'{price_kzt}'} ₸</b>

{SEPARATOR}

⚠️ <i>Нажимая "Купить", ты подтверждаешь готовность к сделке.</i>"""

DEAL_NOT_FOUND = """<b>❌ Сделка не найдена!</b>

Возможно, она была удалена или уже завершена.

👇 <b>Вернись в главное меню:</b>"""

DEAL_ALREADY_SOLD = """<b>❌ Эта сделка уже завершена!</b>

Товар был куплен другим пользователем.

👇 <b>Вернись в главное меню:</b>"""

INSUFFICIENT_BALANCE = f"""<b>❌ Недостаточно средств!</b>

{SEPARATOR}

💰 <b>Твой баланс:</b> {'{balance}'} ₽
💵 <b>Стоимость товара:</b> {'{price}'} ₽
📉 <b>Не хватает:</b> {'{diff}'} ₽

<i>Пополни баланс и попробуй снова.</i>"""

PURCHASE_SUCCESS_BUYER = f"""<b>✅ Оплата принята!</b>

{SEPARATOR}

💰 <b>Списано:</b> {'{price}'} ₽
📦 <b>Товар:</b> {'{title}'}

{SEPARATOR}

Ожидай получения товара от продавца.
После получения нажми кнопку ниже.

⚠️ <i>Если продавец не отвечает в течение 24 часов — открой спор.</i>"""

PURCHASE_NOTIFICATION_SELLER = f"""<b>🔥 У тебя купили товар!</b>

{SEPARATOR}

📦 <b>Товар:</b> {'{title}'}
💰 <b>Сумма:</b> {'{price}'} ₽
👤 <b>Покупатель ID:</b> <code>{'{buyer_id}'}</code>

{SEPARATOR}

📩 <b>Свяжись с покупателем и передай товар.</b>
После передачи покупатель подтвердит получение, и деньги поступят на твой баланс."""

# === БАЛАНС ===

BALANCE_MESSAGE = f"""<b>💳 ТВОЙ КОШЕЛЁК</b>

{SEPARATOR}

💰 <b>Текущий баланс:</b> {'{balance}'} ₽

{SEPARATOR}

<i>Пополнение происходит вручную через модератора для максимальной безопасности.</i>"""

TOPUP_INSTRUCTIONS = f"""<b>🏦 РЕКВИЗИТЫ ДЛЯ ПОПОЛНЕНИЯ</b>

{SEPARATOR}

🏦 <b>Банк:</b> {'{bank}'}
💳 <b>Номер телефона:</b> <code>{'{phone}'}</code>
👤 <b>Получатель:</b> {'{receiver}'}

{SEPARATOR}

✍️ <b>Введи сумму, которую хочешь пополнить (в рублях):</b>"""

TOPUP_AMOUNT_ERROR = """<b>❌ Ошибка!</b>

Введи <b>число</b> (сумма в рублях).
Например: <code>500</code> или <code>1000</code>

👇 <b>Попробуй ещё раз:</b>"""

TOPUP_CONFIRM_MESSAGE = f"""<b>💸 Подтверждение перевода</b>

{SEPARATOR}

Переведи ровно <b>{'{amount}'} ₽</b> по реквизитам выше.

Когда переведёшь — <b>ОБЯЗАТЕЛЬНО</b> нажми кнопку ниже!

⚠️ <i>Если сумма неверна — нажми "Отмена" и введи правильную.</i>"""

TOPUP_SUBMITTED = f"""<b>⏳ Заявка отправлена модератору!</b>

{SEPARATOR}

💰 <b>Сумма:</b> {'{amount}'} ₽

Ожидай зачисления (обычно до 15 минут).
Мы уведомим тебя, когда баланс будет пополнен!"""

TOPUP_APPROVED_USER = f"""<b>✅ Твой баланс успешно пополнен!</b>

{SEPARATOR}

💰 <b>Зачислено:</b> {'{amount}'} ₽
💳 <b>Новый баланс:</b> {'{balance}'} ₽

🎉 <i>Можешь продолжать покупки!</i>"""

TOPUP_REJECTED_USER = f"""<b>❌ Заявка на пополнение отклонена.</b>

{SEPARATOR}

💰 <b>Сумма:</b> {'{amount}'} ₽

<i>Возможно, платёж не был обнаружен. Обратись в поддержку для уточнения.</i>"""

# Модератору
MODERATOR_TOPUP_NOTIFICATION = f"""<b>⚠️ НОВЫЙ ЗАПРОС НА ПОПОЛНЕНИЕ!</b>

{SEPARATOR}

👤 <b>Юзер:</b> <code>{'{user_id}'}</code> (@{'{username}'}, Ник: {'{nickname}'})
💰 <b>Сумма:</b> {'{amount}'} ₽
📅 <b>Время:</b> {'{time}'}

{SEPARATOR}

<i>Проверь поступление на карту Марии Е. и подтверди или отклони.</i>"""

# === ПРОФИЛЬ ===

PROFILE_MESSAGE = f"""<b>👤 ТВОЙ ПРОФИЛЬ</b>

{SEPARATOR}

🏷 <b>Никнейм:</b> {'{nickname}'}
📱 <b>Телефон:</b> {'{phone_masked}'}
🆔 <b>ID:</b> <code>{'{user_id}'}</code>

{SEPARATOR}

📊 <b>СТАТИСТИКА ДОВЕРИЯ:</b>
⭐ <b>Рейтинг:</b> {'{rating}'} / 5.0
✅ <b>Успешных сделок:</b> {'{success}'}
❌ <b>Неудачных сделок:</b> {'{fail}'}

{SEPARATOR}

🛡 <i>Чем больше успешных сделок, тем выше доверие покупателей к тебе!</i>"""

# === СДЕЛКИ ===

MY_DEALS_MESSAGE = f"""<b>📜 ТВОИ АКТИВНЫЕ СДЕЛКИ</b>

{SEPARATOR}

<i>Выбери сделку для управления:</i>"""

NO_DEALS_MESSAGE = f"""<b>😔 У тебя пока нет активных сделок.</b>

{SEPARATOR}

<i>Создай свою первую сделку или найди товары других продавцов!</i>"""

# === ПОДДЕРЖКА ===

SUPPORT_PROMPT = f"""<b>🆘 СЛУЖБА ПОДДЕРЖКИ</b>

{SEPARATOR}

Если у тебя возникли проблемы со сделкой, оплатой или вопросы — опиши проблему одним сообщением ниже. Модератор ответит тебе в ближайшее время!

✍️ <b>Введи свой вопрос:</b>"""

SUPPORT_SENT = f"""<b>✅ Обращение отправлено!</b>

{SEPARATOR}

Ожидай ответа от модератора.
Обычно мы отвечаем в течение 30 минут.

🔔 <i>Тебе придёт уведомление, когда модератор ответит.</i>"""

# === ОБЩЕЕ ===

UNKNOWN_COMMAND = """<b>🤔 Неизвестная команда.</b>

Используй /menu для вызова главного меню."""
`
  },
  {
    path: "handlers/start.py",
    name: "handlers/start.py",
    language: "python",
    description: "Обработчики /start и регистрации (FSM)",
    code: `"""
Обработчики старта и регистрации
"""

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext

import database as db
from states.states import RegistrationStates
from keyboards.inline import get_phone_keyboard, get_main_menu_keyboard, get_back_to_menu_keyboard
from texts.messages import (
    WELCOME_MESSAGE, PHONE_SAVED_MESSAGE, REGISTRATION_COMPLETE_MESSAGE,
    MAIN_MENU_MESSAGE, DEAL_CARD_MESSAGE, DEAL_NOT_FOUND, DEAL_ALREADY_SOLD
)
from utils import send_banner, format_main_menu, format_deal_card

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    """Обработчик /start с поддержкой deep-link"""
    await state.clear()

    # Проверяем deep-link (deal_xxx)
    args = message.text.split(maxsplit=1)
    if len(args) > 1 and args[1].startswith("deal_"):
        deal_id = args[1].replace("deal_", "")
        return await show_deal_card(message, deal_id)

    # Проверяем регистрацию
    if await db.is_registered(message.from_user.id):
        # Уже зарегистрирован -> главное меню
        return await show_main_menu(message)

    # Не зарегистрирован -> запуск FSM
    await state.set_state(RegistrationStates.waiting_for_phone)
    await send_banner(
        message,
        WELCOME_MESSAGE,
        reply_markup=get_phone_keyboard()
    )


@router.message(RegistrationStates.waiting_for_phone, F.contact)
async def process_phone(message: Message, state: FSMContext):
    """Получение номера телефона"""
    phone = message.contact.phone_number
    user_id = message.from_user.id

    # Сохраняем телефон в состояние
    await state.update_data(phone=phone)
    await state.set_state(RegistrationStates.waiting_for_nickname)

    await send_banner(
        message,
        PHONE_SAVED_MESSAGE,
        reply_markup=None  # Убираем клавиатуру
    )


@router.message(RegistrationStates.waiting_for_phone)
async def process_phone_invalid(message: Message):
    """Если юзер отправил что-то кроме контакта"""
    await send_banner(
        message,
        "❌ <b>Пожалуйста, нажми кнопку ниже, чтобы поделиться номером!</b>\\n\\n"
        "Текстовые сообщения сейчас не принимаются.",
        reply_markup=get_phone_keyboard()
    )


@router.message(RegistrationStates.waiting_for_nickname)
async def process_nickname(message: Message, state: FSMContext):
    """Получение никнейма и завершение регистрации"""
    nickname = message.text.strip()

    if len(nickname) < 2 or len(nickname) > 30:
        await send_banner(
            message,
            "❌ <b>Никнейм должен быть от 2 до 30 символов!</b>\\n\\n"
            "✍️ <b>Попробуй ещё раз:</b>"
        )
        return

    # Получаем данные из состояния
    data = await state.get_data()
    phone = data.get("phone", "Не указан")

    # Создаём пользователя в БД
    await db.create_user(
        user_id=message.from_user.id,
        phone=phone,
        nickname=nickname
    )

    await state.clear()

    # Приветствие после регистрации
    await send_banner(
        message,
        REGISTRATION_COMPLETE_MESSAGE.format(nickname=nickname),
        reply_markup=get_main_menu_keyboard()
    )


async def show_main_menu(message_or_callback, state: FSMContext = None):
    """Показать главное меню"""
    user = await db.get_user(message_or_callback.from_user.id)
    if not user:
        return

    rating = round(user["rating_sum"] / user["rating_count"], 1) if user["rating_count"] > 0 else 0.0

    text = format_main_menu(
        nickname=user["nickname"],
        balance=user["balance"],
        rating=rating,
        success=user["successful_deals"],
        fail=user["failed_deals"]
    )

    if isinstance(message_or_callback, Message):
        await send_banner(message_or_callback, text, reply_markup=get_main_menu_keyboard())
    else:
        await send_banner_callback(message_or_callback, text, reply_markup=get_main_menu_keyboard())


async def show_deal_card(message: Message, deal_id: str):
    """Показать карточку товара по deep-link"""
    deal = await db.get_deal(deal_id)

    if not deal:
        await send_banner(message, DEAL_NOT_FOUND, reply_markup=get_back_to_menu_keyboard())
        return

    if deal["status"] != "active":
        await send_banner(message, DEAL_ALREADY_SOLD, reply_markup=get_back_to_menu_keyboard())
        return

    # Получаем данные продавца
    seller = await db.get_user(deal["seller_id"])
    seller_nickname = seller["nickname"] if seller else "Неизвестен"
    seller_rating = round(seller["rating_sum"] / seller["rating_count"], 1) if seller and seller["rating_count"] > 0 else 0.0
    seller_success = seller["successful_deals"] if seller else 0

    # Проверяем регистрацию покупателя
    if not await db.is_registered(message.from_user.id):
        # Покупатель не зарегистрирован
        await state.set_state(RegistrationStates.waiting_for_phone)
        await send_banner(message, WELCOME_MESSAGE, reply_markup=get_phone_keyboard())
        return

    text = format_deal_card(
        seller_nickname=seller_nickname,
        seller_rating=seller_rating,
        seller_success=seller_success,
        category=deal["category"],
        title=deal["title"],
        description=deal["description"],
        price_rub=deal["price_rub"],
        deal_id=deal_id
    )

    from keyboards.inline import get_deal_card_keyboard
    await send_banner(
        message,
        text,
        reply_markup=get_deal_card_keyboard(deal_id, deal["price_rub"])
    )
`
  },
  {
    path: "handlers/menu.py",
    name: "handlers/menu.py",
    language: "python",
    description: "Обработчики главного меню, профиля, поддержки",
    code: `"""
Обработчики главного меню, профиля, баланса, поддержки
"""

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from datetime import datetime

import database as db
from config import MODERATOR_ID
from states.states import SupportStates
from keyboards.inline import (
    get_main_menu_keyboard,
    get_back_to_menu_keyboard,
    get_balance_keyboard,
    get_deals_list_keyboard,
    get_no_deals_keyboard,
)
from texts.messages import (
    MAIN_MENU_MESSAGE, PROFILE_MESSAGE, BALANCE_MESSAGE,
    MY_DEALS_MESSAGE, NO_DEALS_MESSAGE, SUPPORT_PROMPT, SUPPORT_SENT,
    SEPARATOR,
)
from utils import send_banner, send_banner_callback, format_main_menu

router = Router()


# === ГЛАВНОЕ МЕНЮ ===

@router.callback_query(F.data == "main_menu")
async def callback_main_menu(callback: CallbackQuery, state: FSMContext):
    """Возврат в главное меню"""
    await state.clear()
    user = await db.get_user(callback.from_user.id)
    if not user:
        await callback.answer("❌ Ошибка", show_alert=True)
        return

    rating = round(user["rating_sum"] / user["rating_count"], 1) if user["rating_count"] > 0 else 0.0
    text = format_main_menu(
        nickname=user["nickname"],
        balance=user["balance"],
        rating=rating,
        success=user["successful_deals"],
        fail=user["failed_deals"]
    )

    await send_banner_callback(callback, text, reply_markup=get_main_menu_keyboard())
    await callback.answer()


# === КОМАНДА /menu ===

@router.message(F.text == "/menu")
async def cmd_menu(message: Message, state: FSMContext):
    """Команда /menu"""
    await state.clear()
    user = await db.get_user(message.from_user.id)
    if not user:
        await message.answer("❌ Ты не зарегистрирован. Используй /start")
        return

    rating = round(user["rating_sum"] / user["rating_count"], 1) if user["rating_count"] > 0 else 0.0
    text = format_main_menu(
        nickname=user["nickname"],
        balance=user["balance"],
        rating=rating,
        success=user["successful_deals"],
        fail=user["failed_deals"]
    )

    await send_banner(message, text, reply_markup=get_main_menu_keyboard())


# === ПРОФИЛЬ ===

@router.callback_query(F.data == "my_profile")
async def callback_my_profile(callback: CallbackQuery):
    """Показать профиль"""
    user = await db.get_user(callback.from_user.id)
    if not user:
        await callback.answer("❌ Ошибка", show_alert=True)
        return

    rating = round(user["rating_sum"] / user["rating_count"], 1) if user["rating_count"] > 0 else 0.0

    # Маскировка телефона
    phone = user["phone"]
    if phone and len(phone) >= 6:
        phone_masked = phone[:2] + "***" + phone[-4:]
    else:
        phone_masked = "Не указан"

    text = PROFILE_MESSAGE.format(
        nickname=user["nickname"],
        phone_masked=phone_masked,
        user_id=user["user_id"],
        rating=rating,
        success=user["successful_deals"],
        fail=user["failed_deals"]
    )

    await send_banner_callback(callback, text, reply_markup=get_back_to_menu_keyboard())
    await callback.answer()


# === БАЛАНС ===

@router.callback_query(F.data == "my_balance")
async def callback_my_balance(callback: CallbackQuery):
    """Показать баланс"""
    user = await db.get_user(callback.from_user.id)
    if not user:
        await callback.answer("❌ Ошибка", show_alert=True)
        return

    text = BALANCE_MESSAGE.format(balance=user["balance"])
    await send_banner_callback(callback, text, reply_markup=get_balance_keyboard())
    await callback.answer()


# === МОИ СДЕЛКИ ===

@router.callback_query(F.data == "my_deals")
async def callback_my_deals(callback: CallbackQuery):
    """Показать список сделок"""
    deals = await db.get_user_deals(callback.from_user.id)

    if not deals:
        await send_banner_callback(
            callback,
            NO_DEALS_MESSAGE,
            reply_markup=get_no_deals_keyboard()
        )
    else:
        # Фильтруем только активные и ожидающие
        active_deals = [d for d in deals if d["status"] in ("active", "pending")]
        if not active_deals:
            await send_banner_callback(
                callback,
                NO_DEALS_MESSAGE,
                reply_markup=get_no_deals_keyboard()
            )
        else:
            text = MY_DEALS_MESSAGE
            await send_banner_callback(
                callback,
                text,
                reply_markup=get_deals_list_keyboard(active_deals)
            )

    await callback.answer()


# === ПОДДЕРЖКА ===

@router.callback_query(F.data == "support")
async def callback_support(callback: CallbackQuery, state: FSMContext):
    """Начало диалога с поддержкой"""
    await state.set_state(SupportStates.waiting_support_msg)
    await send_banner_callback(callback, SUPPORT_PROMPT, reply_markup=get_back_to_menu_keyboard())
    await callback.answer()


@router.message(SupportStates.waiting_support_msg)
async def process_support_message(message: Message, state: FSMContext):
    """Пересылка сообщения модератору"""
    user = await db.get_user(message.from_user.id)
    nickname = user["nickname"] if user else "Неизвестен"

    # Пересылаем модератору
    support_text = (
        f"<b>🆘 ОБРАЩЕНИЕ В ПОДДЕРЖКУ</b>\\n\\n"
        f"{SEPARATOR}\\n\\n"
        f"👤 <b>От:</b> <code>{message.from_user.id}</code> (Ник: {nickname})\\n"
        f"👤 <b>Username:</b> @{message.from_user.username or 'не указан'}\\n\\n"
        f"📝 <b>Сообщение:</b>\\n{message.text}\\n\\n"
        f"{SEPARATOR}\\n\\n"
        f"<i>Ответь пользователю напрямую.</i>"
    )

    from aiogram.types import FSInputFile
    from config import BANNER_PATH
    try:
        photo = FSInputFile(BANNER_PATH)
        await message.bot.send_photo(
            chat_id=MODERATOR_ID,
            photo=photo,
            caption=support_text,
            parse_mode="HTML"
        )
    except Exception:
        await message.bot.send_message(
            chat_id=MODERATOR_ID,
            text=support_text,
            parse_mode="HTML"
        )

    await state.clear()
    await send_banner(message, SUPPORT_SENT, reply_markup=get_main_menu_keyboard())
`
  },
  {
    path: "handlers/deals.py",
    name: "handlers/deals.py",
    language: "python",
    description: "Обработчики создания сделок, покупки, просмотра",
    code: `"""
Обработчики создания и управления сделками
"""

from aiogram import Router, F
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext

import database as db
from config import REQUIRED_CHANNEL_ID, CHANNEL_URL, BOT_USERNAME, CURRENCY_RATES
from states.states import DealCreationStates
from keyboards.inline import (
    get_subscription_keyboard,
    get_category_keyboard,
    get_back_to_menu_keyboard,
    get_deal_card_keyboard,
    get_buyer_after_purchase_keyboard,
    get_topup_insufficient_keyboard,
)
from texts.messages import (
    SUBSCRIPTION_REQUIRED, CATEGORY_PROMPT, TITLE_PROMPTS,
    DESCRIPTION_PROMPTS, PRICE_PROMPT, PRICE_ERROR,
    DEAL_CREATED_MESSAGE, DEAL_CARD_MESSAGE,
    PURCHASE_SUCCESS_BUYER, PURCHASE_NOTIFICATION_SELLER,
    INSUFFICIENT_BALANCE, SEPARATOR,
)
from utils import send_banner_callback, format_deal_card

router = Router()

# Маппинг категорий
CATEGORY_NAMES = {
    "cat_nft": "🖼 NFT-Подарок",
    "cat_accs": "⚔️ Игровые аккаунты",
    "cat_currency": "💎 Внутриигровая валюта",
    "cat_keys": "🔑 Ключи/Промокоды",
    "cat_boost": "🚀 Буст/Услуги",
}


# === СОЗДАНИЕ СДЕЛКИ ===

@router.callback_query(F.data == "create_deal")
async def start_create_deal(callback: CallbackQuery, state: FSMContext):
    """Начало создания сделки — проверка подписки"""
    # Проверяем подписку на канал
    try:
        member = await callback.bot.get_chat_member(
            chat_id=REQUIRED_CHANNEL_ID,
            user_id=callback.from_user.id
        )
        # Если статус не в активных — просим подписаться
        if member.status in ("left", "kicked"):
            await send_banner_callback(
                callback,
                SUBSCRIPTION_REQUIRED,
                reply_markup=get_subscription_keyboard(CHANNEL_URL)
            )
            await callback.answer()
            return
    except Exception:
        # Если бот не админ в канале — пропускаем проверку
        pass

    # Подписка есть — переходим к выбору категории
    await state.set_state(DealCreationStates.choosing_category)
    await send_banner_callback(callback, CATEGORY_PROMPT, reply_markup=get_category_keyboard())
    await callback.answer()


@router.callback_query(F.data == "check_sub_again")
async def check_subscription_again(callback: CallbackQuery, state: FSMContext):
    """Повторная проверка подписки"""
    try:
        member = await callback.bot.get_chat_member(
            chat_id=REQUIRED_CHANNEL_ID,
            user_id=callback.from_user.id
        )
        if member.status in ("left", "kicked"):
            await callback.answer("❌ Ты не подписан! Подпишись и нажми снова.", show_alert=True)
            return
    except Exception:
        pass

    await state.set_state(DealCreationStates.choosing_category)
    await send_banner_callback(callback, CATEGORY_PROMPT, reply_markup=get_category_keyboard())
    await callback.answer()


# Обработчики выбора категории
@router.callback_query(DealCreationStates.choosing_category, F.data.startswith("cat_"))
async def process_category(callback: CallbackQuery, state: FSMContext):
    """Выбор категории — запрос названия"""
    category = callback.data
    category_name = CATEGORY_NAMES.get(category, category)

    await state.update_data(category=category, category_name=category_name)
    await state.set_state(DealCreationStates.waiting_title)

    title_prompt = TITLE_PROMPTS.get(category, "✍️ <b>Введи название товара:</b>")
    await send_banner_callback(callback, title_prompt)
    await callback.answer()


@router.message(DealCreationStates.waiting_title)
async def process_title(message: Message, state: FSMContext):
    """Получение названия товара"""
    title = message.text.strip()

    if len(title) < 3 or len(title) > 100:
        await send_banner_callback_from_message(
            message,
            "❌ <b>Название должно быть от 3 до 100 символов!</b>\\n\\n"
            "✍️ <b>Попробуй ещё раз:</b>"
        )
        return

    await state.update_data(title=title)
    await state.set_state(DealCreationStates.waiting_description)

    data = await state.get_data()
    desc_prompt = DESCRIPTION_PROMPTS.get(data["category"], "👇 <b>Отправь текст описания:</b>")
    await send_banner_callback_from_message(message, desc_prompt)


@router.message(DealCreationStates.waiting_description)
async def process_description(message: Message, state: FSMContext):
    """Получение описания товара"""
    description = message.text.strip()

    if len(description) < 10 or len(description) > 2000:
        await send_banner_callback_from_message(
            message,
            "❌ <b>Описание должно быть от 10 до 2000 символов!</b>\\n\\n"
            "👇 <b>Попробуй ещё раз:</b>"
        )
        return

    await state.update_data(description=description)
    await state.set_state(DealCreationStates.waiting_price)
    await send_banner_callback_from_message(message, PRICE_PROMPT)


@router.message(DealCreationStates.waiting_price)
async def process_price(message: Message, state: FSMContext):
    """Получение цены и создание сделки"""
    text = message.text.strip().replace(",", ".").replace(" ", "")

    try:
        price = float(text)
        if price <= 0:
            raise ValueError
    except ValueError:
        await send_banner_callback_from_message(message, PRICE_ERROR)
        return

    # Получаем все данные из FSM
    data = await state.get_data()
    await state.clear()

    # Создаём сделку в БД
    deal_id = await db.create_deal(
        seller_id=message.from_user.id,
        category=data["category_name"],
        title=data["title"],
        description=data["description"],
        price_rub=price
    )

    # Формируем ссылку
    deal_link = f"https://t.me/{BOT_USERNAME}?start=deal_{deal_id}"

    text = DEAL_CREATED_MESSAGE.format(
        title=data["title"],
        price_rub=price,
        bot_username=BOT_USERNAME,
        deal_id=deal_id
    )

    await send_banner_callback_from_message(message, text, reply_markup=get_back_to_menu_keyboard())


# === ПОКУПКА ТОВАРА ===

@router.callback_query(F.data.startswith("buy_deal_"))
async def process_purchase(callback: CallbackQuery):
    """Обработка покупки товара"""
    deal_id = callback.data.replace("buy_deal_", "")
    buyer_id = callback.from_user.id

    deal = await db.get_deal(deal_id)
    if not deal or deal["status"] != "active":
        await callback.answer("❌ Сделка уже не активна!", show_alert=True)
        return

    # Нельзя покупать свой товар
    if deal["seller_id"] == buyer_id:
        await callback.answer("❌ Нельзя покупать свой же товар!", show_alert=True)
        return

    # Проверяем баланс покупателя
    balance = await db.get_balance(buyer_id)
    if balance < deal["price_rub"]:
        diff = deal["price_rub"] - balance
        text = INSUFFICIENT_BALANCE.format(
            balance=balance,
            price=deal["price_rub"],
            diff=diff
        )
        await send_banner_callback(callback, text, reply_markup=get_topup_insufficient_keyboard())
        await callback.answer()
        return

    # Списываем деньги с покупателя
    await db.update_balance(buyer_id, -deal["price_rub"])

    # Меняем статус сделки
    await db.update_deal_status(deal_id, "pending", buyer_id)

    # Уведомляем покупателя
    buyer_text = PURCHASE_SUCCESS_BUYER.format(
        price=deal["price_rub"],
        title=deal["title"]
    )
    await send_banner_callback(
        callback,
        buyer_text,
        reply_markup=get_buyer_after_purchase_keyboard(deal_id)
    )

    # Уведомляем продавца
    seller_text = PURCHASE_NOTIFICATION_SELLER.format(
        title=deal["title"],
        price=deal["price_rub"],
        buyer_id=buyer_id
    )
    try:
        from utils import send_banner_to_user
        await send_banner_to_user(
            callback.bot,
            deal["seller_id"],
            seller_text
        )
    except Exception:
        await callback.bot.send_message(
            chat_id=deal["seller_id"],
            text=seller_text,
            parse_mode="HTML"
        )

    await callback.answer()


# === ПОДТВЕРЖДЕНИЕ ПОЛУЧЕНИЯ ===

@router.callback_query(F.data.startswith("confirm_receive_"))
async def confirm_receive(callback: CallbackQuery):
    """Покупатель подтверждает получение товара"""
    deal_id = callback.data.replace("confirm_receive_", "")
    deal = await db.get_deal(deal_id)

    if not deal or deal["status"] != "pending":
        await callback.answer("❌ Сделка уже завершена!", show_alert=True)
        return

    if deal["buyer_id"] != callback.from_user.id:
        await callback.answer("❌ Это не твоя сделка!", show_alert=True)
        return

    # Завершаем сделку
    await db.update_deal_status(deal_id, "completed")

    # Начисляем деньги продавцу
    await db.update_balance(deal["seller_id"], deal["price_rub"])

    # Обновляем статистику
    await db.increment_deals(deal["seller_id"], True)
    await db.increment_deals(deal["buyer_id"], True)

    # Уведомляем продавца
    seller_text = (
        f"<b>💰 Сделка завершена!</b>\\n\\n"
        f"{SEPARATOR}\\n\\n"
        f"📦 <b>Товар:</b> {deal['title']}\\n"
        f"💰 <b>Зачислено на баланс:</b> {deal['price_rub']} ₽\\n\\n"
        f"🎉 <i>Покупатель подтвердил получение!</i>"
    )
    try:
        await callback.bot.send_message(
            chat_id=deal["seller_id"],
            text=seller_text,
            parse_mode="HTML"
        )
    except Exception:
        pass

    # Ответ покупателю
    await send_banner_callback(
        callback,
        f"<b>✅ Спасибо за подтверждение!</b>\\n\\n"
        f"{SEPARATOR}\\n\\n"
        f"Сделка завершена. Оцени продавца, если хочешь!\\n\\n"
        f"🎉 <i>Удачных покупок!</i>",
        reply_markup=get_back_to_menu_keyboard()
    )
    await callback.answer()


# === СПОР ===

@router.callback_query(F.data.startswith("dispute_"))
async def open_dispute(callback: CallbackQuery):
    """Открытие спора"""
    deal_id = callback.data.replace("dispute_", "")
    from config import MODERATOR_ID

    deal = await db.get_deal(deal_id)
    if not deal:
        await callback.answer("❌ Сделка не найдена!", show_alert=True)
        return

    # Уведомляем модератора
    dispute_text = (
        f"<b>⚠️ ОТКРЫТ СПОР!</b>\\n\\n"
        f"{SEPARATOR}\\n\\n"
        f"📦 <b>Сделка:</b> {deal['title']}\\n"
        f"💰 <b>Сумма:</b> {deal['price_rub']} ₽\\n"
        f"👤 <b>Покупатель:</b> <code>{callback.from_user.id}</code>\\n"
        f"👤 <b>Продавец:</b> <code>{deal['seller_id']}</code>\\n"
        f"🆔 <b>Deal ID:</b> <code>{deal_id}</code>\\n\\n"
        f"<i>Требуется вмешательство модератора.</i>"
    )

    await callback.bot.send_message(
        chat_id=MODERATOR_ID,
        text=dispute_text,
        parse_mode="HTML"
    )

    await send_banner_callback(
        callback,
        f"<b>⚠️ Спор открыт!</b>\\n\\n"
        f"{SEPARATOR}\\n\\n"
        f"Модератор рассмотрит ситуацию в ближайшее время.\\n"
        f"Деньги заморожены до разрешения спора.\\n\\n"
        f"<i>Ожидай уведомления от модератора.</i>",
        reply_markup=get_back_to_menu_keyboard()
    )
    await callback.answer()


# === ПРОСМОТР СДЕЛКИ ===

@router.callback_query(F.data.startswith("view_deal_"))
async def view_deal(callback: CallbackQuery):
    """Просмотр конкретной сделки"""
    deal_id = callback.data.replace("view_deal_", "")
    deal = await db.get_deal(deal_id)

    if not deal:
        await callback.answer("❌ Сделка не найдена!", show_alert=True)
        return

    status_emoji = {
        "active": "🟢 Активна",
        "pending": "🟡 Ожидает подтверждения",
        "completed": "✅ Завершена",
        "cancelled": "❌ Отменена",
    }

    text = (
        f"<b>📦 ДЕТАЛИ СДЕЛКИ</b>\\n\\n"
        f"{SEPARATOR}\\n\\n"
        f"🏷 <b>Товар:</b> {deal['title']}\\n"
        f"📦 <b>Категория:</b> {deal['category']}\\n"
        f"💰 <b>Цена:</b> {deal['price_rub']} ₽\\n"
        f"📊 <b>Статус:</b> {status_emoji.get(deal['status'], deal['status'])}\\n\\n"
        f"📝 <b>Описание:</b>\\n<i>{deal['description']}</i>\\n\\n"
        f"{SEPARATOR}"
    )

    if deal["status"] == "active" and deal["seller_id"] == callback.from_user.id:
        # Продавец может скопировать ссылку
        from config import BOT_USERNAME
        deal_link = f"https://t.me/{BOT_USERNAME}?start=deal_{deal_id}"
        text += f"\\n\\n🔗 <b>Ссылка:</b>\\n<code>{deal_link}</code>"

    await send_banner_callback(callback, text, reply_markup=get_back_to_menu_keyboard())
    await callback.answer()


# === Вспомогательная функция ===

async def send_banner_callback_from_message(message: Message, text: str, reply_markup=None):
    """Отправка баннера из Message (не callback)"""
    from utils import send_banner
    await send_banner(message, text, reply_markup=reply_markup)
`
  },
  {
    path: "handlers/payments.py",
    name: "handlers/payments.py",
    language: "python",
    description: "Обработчики пополнения баланса и модерации",
    code: `"""
Обработчики пополнения баланса и модерации
"""

from aiogram import Router, F
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from datetime import datetime

import database as db
from config import MODERATOR_ID, TOPUP_BANK, TOPUP_PHONE, TOPUP_RECEIVER
from states.states import TopupStates
from keyboards.inline import (
    get_topup_confirm_keyboard,
    get_back_to_menu_keyboard,
    get_moderator_topup_keyboard,
    get_main_menu_keyboard,
)
from texts.messages import (
    TOPUP_INSTRUCTIONS, TOPUP_AMOUNT_ERROR,
    TOPUP_CONFIRM_MESSAGE, TOPUP_SUBMITTED,
    TOPUP_APPROVED_USER, TOPUP_REJECTED_USER,
    MODERATOR_TOPUP_NOTIFICATION, BALANCE_MESSAGE, SEPARATOR,
)
from utils import send_banner_callback, send_banner_callback_from_message

router = Router()


# === НАЧАЛО ПОПОЛНЕНИЯ ===

@router.callback_query(F.data == "topup_start")
async def start_topup(callback: CallbackQuery, state: FSMContext):
    """Начало процесса пополнения"""
    await state.set_state(TopupStates.waiting_topup_amount)

    text = TOPUP_INSTRUCTIONS.format(
        bank=TOPUP_BANK,
        phone=TOPUP_PHONE,
        receiver=TOPUP_RECEIVER
    )

    await send_banner_callback(callback, text)
    await callback.answer()


@router.message(TopupStates.waiting_topup_amount)
async def process_topup_amount(message: Message, state: FSMContext):
    """Получение суммы пополнения"""
    text = message.text.strip().replace(",", ".").replace(" ", "")

    try:
        amount = float(text)
        if amount <= 0 or amount > 1000000:
            raise ValueError
    except ValueError:
        await send_banner_callback_from_message(message, TOPUP_AMOUNT_ERROR)
        return

    await state.update_data(topup_amount=amount)
    await state.set_state(TopupStates.waiting_topup_confirm)

    confirm_text = TOPUP_CONFIRM_MESSAGE.format(amount=amount)
    from keyboards.inline import get_topup_confirm_keyboard
    await send_banner_callback_from_message(
        message,
        confirm_text,
        reply_markup=get_topup_confirm_keyboard(amount)
    )


# === ПОДТВЕРЖДЕНИЕ ПОПОЛНЕНИЯ ===

@router.callback_query(F.data.startswith("confirm_topup_"))
async def confirm_topup(callback: CallbackQuery, state: FSMContext):
    """Пользователь подтвердил, что отправил деньги"""
    amount = float(callback.data.replace("confirm_topup_", ""))
    user_id = callback.from_user.id

    await state.clear()

    # Создаём запись о пополнении
    topup_id = await db.create_topup(user_id, amount)

    # Получаем данные пользователя
    user = await db.get_user(user_id)
    nickname = user["nickname"] if user else "Неизвестен"
    username = callback.from_user.username or "не указан"
    current_time = datetime.now().strftime("%d.%m.%Y %H:%M")

    # Уведомляем модератора
    moderator_text = MODERATOR_TOPUP_NOTIFICATION.format(
        user_id=user_id,
        username=username,
        nickname=nickname,
        amount=amount,
        time=current_time
    )

    try:
        from utils import send_banner_to_user
        await send_banner_to_user(
            callback.bot,
            MODERATOR_ID,
            moderator_text,
            reply_markup=get_moderator_topup_keyboard(topup_id, amount)
        )
    except Exception:
        await callback.bot.send_message(
            chat_id=MODERATOR_ID,
            text=moderator_text,
            parse_mode="HTML",
            reply_markup=get_moderator_topup_keyboard(topup_id, amount)
        )

    # Ответ пользователю
    user_text = TOPUP_SUBMITTED.format(amount=amount)
    await send_banner_callback(callback, user_text, reply_markup=get_back_to_menu_keyboard())
    await callback.answer()


# === ДЕЙСТВИЯ МОДЕРАТОРА ===

@router.callback_query(F.data.startswith("admin_approve_"))
async def admin_approve_topup(callback: CallbackQuery):
    """Модератор одобряет пополнение"""
    topup_id = callback.data.replace("admin_approve_", "")

    # Проверяем что это модератор
    if callback.from_user.id != MODERATOR_ID:
        await callback.answer("❌ Доступ запрещён!", show_alert=True)
        return

    topup = await db.get_topup(topup_id)
    if not topup or topup["status"] != "waiting":
        await callback.answer("❌ Заявка уже обработана!", show_alert=True)
        return

    # Обновляем статус
    await db.update_topup_status(topup_id, "approved")

    # Зачисляем деньги
    await db.update_balance(topup["user_id"], topup["amount"])

    # Получаем новый баланс
    new_balance = await db.get_balance(topup["user_id"])

    # Уведомляем пользователя
    user_text = TOPUP_APPROVED_USER.format(
        amount=topup["amount"],
        balance=new_balance
    )
    try:
        from utils import send_banner_to_user
        await send_banner_to_user(callback.bot, topup["user_id"], user_text)
    except Exception:
        await callback.bot.send_message(
            chat_id=topup["user_id"],
            text=user_text,
            parse_mode="HTML"
        )

    # Обновляем сообщение модератора
    await callback.message.edit_text(
        callback.message.caption or callback.message.text + "\\n\\n✅ <b>ОДОБРЕНО И ЗАЧИСЛЕНО</b>",
        parse_mode="HTML"
    )
    await callback.answer("✅ Зачислено!", show_alert=True)


@router.callback_query(F.data.startswith("admin_reject_"))
async def admin_reject_topup(callback: CallbackQuery):
    """Модератор отклоняет пополнение"""
    topup_id = callback.data.replace("admin_reject_", "")

    # Проверяем что это модератор
    if callback.from_user.id != MODERATOR_ID:
        await callback.answer("❌ Доступ запрещён!", show_alert=True)
        return

    topup = await db.get_topup(topup_id)
    if not topup or topup["status"] != "waiting":
        await callback.answer("❌ Заявка уже обработана!", show_alert=True)
        return

    # Обновляем статус
    await db.update_topup_status(topup_id, "rejected")

    # Уведомляем пользователя
    user_text = TOPUP_REJECTED_USER.format(amount=topup["amount"])
    try:
        from utils import send_banner_to_user
        await send_banner_to_user(callback.bot, topup["user_id"], user_text)
    except Exception:
        await callback.bot.send_message(
            chat_id=topup["user_id"],
            text=user_text,
            parse_mode="HTML"
        )

    # Обновляем сообщение модератора
    await callback.message.edit_text(
        callback.message.caption or callback.message.text + "\\n\\n❌ <b>ОТКЛОНЕНО</b>",
        parse_mode="HTML"
    )
    await callback.answer("❌ Отклонено", show_alert=True)
`
  },
  {
    path: "utils.py",
    name: "utils.py",
    language: "python",
    description: "Вспомогательные функции (отправка баннеров, форматирование)",
    code: `"""
Вспомогательные утилиты бота
"""

from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, Bot
from aiogram.types import FSInputFile, InputMediaPhoto
from config import BANNER_PATH, CURRENCY_RATES, CURRENCY_SYMBOLS, CURRENCY_FLAGS
from texts.messages import MAIN_MENU_MESSAGE, DEAL_CARD_MESSAGE, SEPARATOR


async def send_banner(
    target: Message,
    text: str,
    reply_markup: InlineKeyboardMarkup = None
):
    """
    Отправка сообщения с баннер-картинкой.
    Используется ВЕЗДЕ вместо обычного answer().
    """
    try:
        photo = FSInputFile(BANNER_PATH)
        await target.answer_photo(
            photo=photo,
            caption=text,
            parse_mode="HTML",
            reply_markup=reply_markup
        )
    except Exception:
        # Если баннер не найден — отправляем просто текст
        await target.answer(
            text=text,
            parse_mode="HTML",
            reply_markup=reply_markup
        )


async def send_banner_callback(
    callback: CallbackQuery,
    text: str,
    reply_markup: InlineKeyboardMarkup = None
):
    """
    Отправка баннера в ответ на callback_query.
    Удаляет старое сообщение и отправляет новое с баннером.
    """
    try:
        # Удаляем старое сообщение
        try:
            await callback.message.delete()
        except Exception:
            pass

        photo = FSInputFile(BANNER_PATH)
        await callback.message.answer_photo(
            photo=photo,
            caption=text,
            parse_mode="HTML",
            reply_markup=reply_markup
        )
    except Exception:
        # Фолбэк — редактируем текст
        try:
            await callback.message.edit_caption(
                caption=text,
                parse_mode="HTML",
                reply_markup=reply_markup
            )
        except Exception:
            await callback.message.answer(
                text=text,
                parse_mode="HTML",
                reply_markup=reply_markup
            )


async def send_banner_to_user(
    bot: Bot,
    chat_id: int,
    text: str,
    reply_markup: InlineKeyboardMarkup = None
):
    """
    Отправка баннера конкретному пользователю по chat_id.
    """
    try:
        photo = FSInputFile(BANNER_PATH)
        await bot.send_photo(
            chat_id=chat_id,
            photo=photo,
            caption=text,
            parse_mode="HTML",
            reply_markup=reply_markup
        )
    except Exception:
        await bot.send_message(
            chat_id=chat_id,
            text=text,
            parse_mode="HTML",
            reply_markup=reply_markup
        )


def format_main_menu(
    nickname: str,
    balance: float,
    rating: float,
    success: int,
    fail: int
) -> str:
    """Форматирование текста главного меню"""
    return MAIN_MENU_MESSAGE.format(
        nickname=nickname,
        balance=balance,
        rating=rating,
        success=success,
        fail=fail
    )


def format_deal_card(
    seller_nickname: str,
    seller_rating: float,
    seller_success: int,
    category: str,
    title: str,
    description: str,
    price_rub: float,
    deal_id: str
) -> str:
    """Форматирование карточки товара с конвертацией валют"""
    price_usd = round(price_rub * CURRENCY_RATES["USD"], 2)
    price_eur = round(price_rub * CURRENCY_RATES["EUR"], 2)
    price_uah = round(price_rub * CURRENCY_RATES["UAH"], 2)
    price_kzt = round(price_rub * CURRENCY_RATES["KZT"], 2)

    return DEAL_CARD_MESSAGE.format(
        seller_nickname=seller_nickname,
        seller_rating=seller_rating,
        seller_success=seller_success,
        category=category,
        title=title,
        description=description,
        price_rub=price_rub,
        price_usd=price_usd,
        price_eur=price_eur,
        price_uah=price_uah,
        price_kzt=price_kzt
    )


def convert_price(price_rub: float) -> dict:
    """Конвертация цены во все валюты"""
    return {
        currency: round(price_rub * rate, 2)
        for currency, rate in CURRENCY_RATES.items()
    }
`
  },
  {
    path: "bot.py",
    name: "bot.py",
    language: "python",
    description: "Точка входа — запуск бота, регистрация роутеров",
    code: `"""
PLAYEROK Market Bot — Точка входа
Запуск бота и регистрация всех роутеров
"""

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage

from config import BOT_TOKEN
import database as db

# Импорт роутеров
from handlers.start import router as start_router
from handlers.menu import router as menu_router
from handlers.deals import router as deals_router
from handlers.payments import router as payments_router

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)


async def on_startup():
    """Действия при запуске бота"""
    logger.info("Инициализация базы данных...")
    await db.init_db()
    logger.info("✅ База данных готова!")


async def main():
    """Главная функция запуска"""
    # Инициализация бота и диспетчера
    bot = Bot(token=BOT_TOKEN)
    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)

    # Регистрация роутеров (порядок важен!)
    dp.include_router(start_router)      # /start и deep-link
    dp.include_router(payments_router)   # Пополнение (должен быть до deals для FSM)
    dp.include_router(deals_router)      # Сделки
    dp.include_router(menu_router)       # Меню, профиль, поддержка

    # Выполняем действия при старте
    await on_startup()

    logger.info("🚀 Бот PLAYEROK Market запущен!")
    logger.info(f"📋 Модератор ID: {6930148555}")

    # Запуск polling
    try:
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    except Exception as e:
        logger.error(f"❌ Ошибка при работе бота: {e}")
    finally:
        await bot.session.close()
        logger.info("🛑 Бот остановлен.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Бот остановлен пользователем.")
`
  },
  {
    path: "requirements.txt",
    name: "requirements.txt",
    language: "text",
    description: "Зависимости проекта",
    code: `aiogram==3.4.1
aiosqlite==0.19.0
`
  },
  {
    path: "README.md",
    name: "README.md",
    language: "markdown",
    description: "Инструкция по установке и запуску",
    code: `# 🎮 PLAYEROK Market Bot

Telegram-бот маркетплейса для покупки/продажи игровых товаров.

## 📋 Возможности

- ✅ Регистрация через номер телефона
- 🛍 Создание сделок с deep-link
- 💳 Пополнение баланса через модератора
- 📊 Система рейтинга и статистики
- 🆘 Поддержка через бота
- 🌍 Конвертация цен в 5 валют

## 🚀 Установка

\`\`\`bash
# 1. Клонируйте репозиторий
git clone <repo_url>
cd playerok-bot

# 2. Создайте виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\\Scripts\\activate  # Windows

# 3. Установите зависимости
pip install -r requirements.txt

# 4. Настройте config.py
# - Укажите BOT_TOKEN (от @BotFather)
# - Укажите MODERATOR_ID
# - Укажите REQUIRED_CHANNEL_ID
# - Укажите BOT_USERNAME

# 5. Положите banner.jpg в корень проекта

# 6. Запустите бота
python bot.py
\`\`\`

## 📁 Структура проекта

\`\`\`
playerok-bot/
├── bot.py              # Точка входа
├── config.py           # Конфигурация
├── database.py         # Работа с БД
├── utils.py            # Утилиты
├── banner.jpg          # Баннер для сообщений
├── requirements.txt    # Зависимости
├── handlers/
│   ├── start.py        # /start и регистрация
│   ├── menu.py         # Главное меню, профиль
│   ├── deals.py        # Создание и покупка сделок
│   └── payments.py     # Пополнение баланса
├── keyboards/
│   └── inline.py       # Все клавиатуры
├── states/
│   └── states.py       # FSM состояния
└── texts/
    └── messages.py     # Все тексты
\`\`\`

## ⚙️ Настройка

1. Получите токен бота у [@BotFather](https://t.me/BotFather)
2. Добавьте бота в канал как администратора
3. Узнайте ID канала (перешлите сообщение из канала @userinfobot)
4. Заполните config.py

## 📝 Лицензия

MIT
`
  }
];
