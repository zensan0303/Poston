'use client';

import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useState, useCallback } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Event } from '@/types';

// 2026年・2027年の日本の祝日（ハードコード）
const HOLIDAYS_2026: { [key: string]: string } = {
  '2026-01-01': '元日',
  '2026-01-12': '成人の日',
  '2026-02-11': '建国記念の日',
  '2026-02-23': '天皇誕生日',
  '2026-03-20': '春分の日',
  '2026-04-29': '昭和の日',
  '2026-05-03': '憲法記念日',
  '2026-05-04': 'みどりの日',
  '2026-05-05': 'こどもの日',
  '2026-07-20': '海の日',
  '2026-08-11': '山の日',
  '2026-09-21': '敬老の日',
  '2026-09-22': '国民の休日',
  '2026-09-23': '秋分の日',
  '2026-10-12': 'スポーツの日',
  '2026-11-03': '文化の日',
  '2026-11-23': '勤労感謝の日',

  '2027-01-01': '元日',
  '2027-01-11': '成人の日',
  '2027-02-11': '建国記念の日',
  '2027-02-23': '天皇誕生日',
  '2027-03-21': '春分の日',
  '2027-03-22': '振替休日',
  '2027-04-29': '昭和の日',
  '2027-05-03': '憲法記念日',
  '2027-05-04': 'みどりの日',
  '2027-05-05': 'こどもの日',
  '2027-07-19': '海の日',
  '2027-08-11': '山の日',
  '2027-09-20': '敬老の日',
  '2027-09-23': '秋分の日',
  '2027-10-11': 'スポーツの日',
  '2027-11-03': '文化の日',
  '2027-11-23': '勤労感謝の日',
};

const locales = {
  ja: ja,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ja }),
  getDay,
  locales,
});

interface CalendarProps {
  events: Event[];
  onSelectEvent?: (event: Event) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
}

// BigCalendarのビューボタンを非表示にするスタイル
const calendarStyles = `
  .rbc-btn-group {
    display: none;
  }
  .rbc-today {
    background-color: #e8f4fd;
  }
  /* 土日祝日セルの背景色 */
  .rbc-day-weekend {
    background-color: #fff5f5 !important;
  }
  /* 週ビュー・日ビューの土日祝日列 */
  .rbc-time-view .rbc-day-weekend {
    background-color: #fff5f5 !important;
  }
  /* モバイル：月末6行でも見切れないよう行の最小高さを確保 */
  .rbc-month-row {
    min-height: 72px;
    overflow: visible;
  }
  /* 日付セルの高さを固定してイベントがずれないようにする */
  .rbc-month-view .rbc-date-cell {
    padding: 1px 3px;
    height: 22px;
    line-height: 1.2;
    overflow: hidden;
  }
  /* イベントが日付直下に配置されるよう調整 */
  .rbc-row-content {
    position: relative;
  }
  @media (max-width: 640px) {
    .rbc-month-row {
      min-height: 68px;
    }
    .rbc-month-view .rbc-date-cell {
      padding: 1px 2px;
      height: 18px;
      font-size: 0.8rem;
    }
    .rbc-event {
      padding: 1px 2px !important;
      font-size: 0.68rem !important;
      border-radius: 4px !important;
      line-height: 1.2;
    }
    .rbc-event-content {
      font-size: 0.68rem;
      line-height: 1.2;
    }
  }
  /* +N件ボタンをタップしやすく */
  .rbc-show-more {
    font-size: 0.75rem;
    font-weight: 700;
    color: #0284c7;
    padding: 1px 4px;
    background: #e0f2fe;
    border-radius: 4px;
    margin-top: 1px;
    display: block;
  }
  /* ポップアップを見やすく */
  .rbc-overlay {
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    border: none;
    padding: 8px;
    z-index: 9999;
  }
  .rbc-overlay-header {
    font-size: 1rem;
    font-weight: 700;
    padding: 6px 8px;
    border-bottom: 2px solid #e2e8f0;
    margin-bottom: 4px;
  }
`;

// 日本の祝日を判定する関数
const isJapaneseHoliday = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  return dateStr in HOLIDAYS_2026;
};

// 土日祝日かどうかの判定
const isWeekendOrHoliday = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6 || isJapaneseHoliday(date);
};

// カスタム日付ヘッダー（月ビュー）
const CustomDateHeader = ({ date, label }: { date: Date; label: string }) => {
  const shouldHighlight = isWeekendOrHoliday(date);

  return (
    <span style={shouldHighlight ? { color: '#e53e3e', fontWeight: '700' } : {}}>
      {label}
    </span>
  );
};

export default function Calendar({ events, onSelectEvent, onSelectSlot }: CalendarProps) {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  const handleSelectEvent = useCallback(
    (event: Event) => {
      if (onSelectEvent) {
        onSelectEvent(event);
      }
    },
    [onSelectEvent]
  );

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      if (onSelectSlot) {
        onSelectSlot(slotInfo);
      }
    },
    [onSelectSlot]
  );

  // イベントのスタイルを設定
  const eventStyleGetter = (event: Event, start: Date) => {
    let backgroundColor = '#00bfff';
    let borderColor = '#0088cc';
    
    switch (event.type) {
      case 'practice':
        backgroundColor = '#00bfff';
        borderColor = '#0088cc';
        break;
      case 'game':
        backgroundColor = '#ff6b6b';
        borderColor = '#cc3333';
        break;
      case 'meeting':
        backgroundColor = '#868e96';
        borderColor = '#5a6268';
        break;
      default:
        backgroundColor = '#868e96';
        borderColor = '#5a6268';
    }

    const isOutOfMonthInMonthView =
      view === 'month' &&
      (start.getFullYear() !== date.getFullYear() || start.getMonth() !== date.getMonth());

    if (isOutOfMonthInMonthView) {
      return {
        style: {
          backgroundColor: '#e5e7eb',
          borderRadius: '8px',
          opacity: 0.9,
          color: '#6b7280',
          border: '1px solid #d1d5db',
          display: 'block',
          fontWeight: '600',
          boxShadow: 'none',
        },
      };
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.95,
        color: 'white',
        border: `2px solid ${borderColor}`,
        display: 'block',
        fontWeight: '600',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
    };
  };

  // 土日祝日セルにクラス付与
  const dayPropGetter = (cellDate: Date) => {
    // 月表示では当月以外（前月/翌月の補完セル）は着色しない
    if (view === 'month') {
      const isSameMonthAsViewDate =
        cellDate.getFullYear() === date.getFullYear() &&
        cellDate.getMonth() === date.getMonth();

      if (!isSameMonthAsViewDate) {
        return {};
      }
    }

    if (isWeekendOrHoliday(cellDate)) {
      return { className: 'rbc-day-weekend' };
    }
    return {};
  };

  // カスタムメッセージ（日本語）
  const messages = {
    allDay: '終日',
    previous: '前',
    next: '次',
    today: '今日',
    month: '月',
    week: '週',
    day: '日',
    agenda: '予定',
    date: '日付',
    time: '時間',
    event: 'イベント',
    noEventsInRange: 'この期間にイベントはありません',
    showMore: (total: number) => `+${total}件表示`,
  };

  return (
    <>
      <style>{calendarStyles}</style>
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
      {/* カレンダーヘッダー */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base md:text-2xl font-bold flex items-center gap-2 whitespace-nowrap text-white">
            <CalendarDays size={20} aria-hidden="true" className="text-white/90" />
            <span className="text-white">{view === 'month' ? '月間' : view === 'week' ? '週間' : '日間'}</span>
          </h3>
          <div className="flex gap-2 md:gap-2 flex-shrink-0">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg font-bold transition-all text-sm md:text-base ${
                view === 'month'
                  ? 'bg-white text-primary-700 shadow-md'
                  : 'bg-primary-400/60 text-white/95 hover:bg-primary-400/80'
              }`}
            >
              月
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg font-bold transition-all text-sm md:text-base ${
                view === 'week'
                  ? 'bg-white text-primary-700 shadow-md'
                  : 'bg-primary-400/60 text-white/95 hover:bg-primary-400/80'
              }`}
            >
              週
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-lg font-bold transition-all text-sm md:text-base ${
                view === 'day'
                  ? 'bg-white text-primary-700 shadow-md'
                  : 'bg-primary-400/60 text-white/95 hover:bg-primary-400/80'
              }`}
            >
              日
            </button>
          </div>
        </div>
      </div>
      
      {/* カレンダー本体 */}
      <div className="h-[520px] md:h-[600px] p-2 md:p-4 overflow-auto">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          popup
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          dayPropGetter={dayPropGetter}
          components={{
            month: { dateHeader: CustomDateHeader },
          }}
          messages={messages}
          culture="ja"
          style={{ height: '100%' }}
          step={60}
          timeslots={1}
          defaultView="month"
          views={['month', 'week', 'day']}
          min={new Date(1970, 1, 1, 5, 0, 0)}
          max={new Date(1970, 1, 1, 21, 0, 0)}
        />
      </div>

      {/* 前後の予定ナビゲーション */}
      <div className="border-t border-gray-200 p-4 md:p-4 bg-gray-50">
        <div className="flex gap-2 justify-between">
          <button
            onClick={() => {
              const newDate = new Date(date);
              if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
              else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
              else newDate.setDate(newDate.getDate() - 1);
              setDate(newDate);
            }}
            className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-4 px-4 rounded-lg transition-all shadow-md text-sm md:text-lg whitespace-nowrap text-left"
          >
            <span className="inline-flex items-center gap-2 w-full justify-start">
              <span className="w-4 text-center" aria-hidden="true">
                <ChevronLeft size={16} className="text-white/90" />
              </span>
              <span className="text-white">前へ</span>
            </span>
          </button>
          <button
            onClick={() => setDate(new Date())}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 px-4 rounded-lg transition-all shadow-md text-sm md:text-lg whitespace-nowrap text-left"
          >
            <span className="inline-flex items-center gap-2 w-full justify-start">
              <span className="w-4 text-center" aria-hidden="true">
                <CalendarDays size={16} className="text-gray-500" />
              </span>
              <span className="text-gray-700">今日</span>
            </span>
          </button>
          <button
            onClick={() => {
              const newDate = new Date(date);
              if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
              else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
              else newDate.setDate(newDate.getDate() + 1);
              setDate(newDate);
            }}
            className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-4 px-4 rounded-lg transition-all shadow-md text-sm md:text-lg whitespace-nowrap text-left"
          >
            <span className="inline-flex items-center gap-2 w-full justify-start">
              <span className="w-4 text-center" aria-hidden="true">
                <ChevronRight size={16} className="text-white/90" />
              </span>
              <span className="text-white">次へ</span>
            </span>
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
