'use client';

import { GameResult } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface GameResultModalProps {
  game: GameResult;
  isOpen: boolean;
  onClose: () => void;
}

export default function GameResultModal({ game, isOpen, onClose }: GameResultModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="bg-primary-500 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl-mobile md:text-3xl font-bold">
                {game.ourTeamName} vs {game.opponent}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:opacity-80 rounded-full w-10 h-10 flex items-center justify-center text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* 本文 */}
        <div className="p-6 space-y-4">
          {/* 日時 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-gray-700">📅 試合日</h3>
            <p className="text-lg">
              {format(game.date, 'yyyy年M月d日(E)', { locale: ja })}
            </p>
          </div>

          {/* スコア */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-center text-gray-700">スコア</h3>
            <div className="flex justify-center items-center gap-8">
              <div className="text-center">
                <p className="text-lg text-gray-600 mb-2">{game.ourTeamName}</p>
                <p className="text-5xl font-bold text-primary-600">{game.ourScore}</p>
              </div>
              <div className="text-3xl font-bold text-gray-400">-</div>
              <div className="text-center">
                <p className="text-lg text-gray-600 mb-2">{game.opponent}</p>
                <p className="text-5xl font-bold text-gray-600">{game.opponentScore}</p>
              </div>
            </div>

            {/* イニング別内訳 */}
            {game.inningScores && game.inningScores.length > 0 && (() => {
              const scores = game.inningScores;
              const lastIdx = scores.length - 1;
              const showX = game.showX ?? false;

              // 先攻行・後攻行を決定
              const topTeamName = game.isHomeTeam ? game.opponent : game.ourTeamName;
              const bottomTeamName = game.isHomeTeam ? game.ourTeamName : game.opponent;
              const topTotal = game.isHomeTeam ? game.opponentScore : game.ourScore;
              const bottomTotal = game.isHomeTeam ? game.ourScore : game.opponentScore;
              const topScores = scores.map(s => game.isHomeTeam ? s.opponentScore : s.ourScore);
              const bottomScores = scores.map(s => game.isHomeTeam ? s.ourScore : s.opponentScore);

              return (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-center border-collapse text-sm" style={{ minWidth: '320px' }}>
                    <thead>
                      <tr className="bg-primary-500 text-white">
                        <th className="px-2 py-2 text-left rounded-tl-lg w-20">チーム</th>
                        {scores.map(s => (
                          <th key={s.inning} className="px-2 py-2 w-8">{s.inning}</th>
                        ))}
                        <th className="px-2 py-2 bg-primary-700 font-bold rounded-tr-lg w-10">計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 先攻行（表） */}
                      <tr className="border-b border-primary-200">
                        <td className="px-2 py-2 text-left font-bold text-gray-700 bg-gray-50">{topTeamName}</td>
                        {topScores.map((score, i) => (
                          <td key={i} className="px-2 py-2 font-bold text-gray-700 bg-gray-50">{score}</td>
                        ))}
                        <td className="px-2 py-2 font-bold text-gray-700 bg-gray-100">{topTotal}</td>
                      </tr>
                      {/* 後攻行（裏） */}
                      <tr>
                        <td className="px-2 py-2 text-left font-bold text-primary-700 bg-primary-50">{bottomTeamName}</td>
                        {bottomScores.map((score, i) => (
                          <td key={i} className="px-2 py-2 font-bold text-primary-700 bg-primary-50">
                            {i === lastIdx && showX
                              ? <span>{score}<span className="text-gray-500">x</span></span>
                              : score}
                          </td>
                        ))}
                        <td className="px-2 py-2 font-bold text-primary-700 bg-primary-100">{bottomTotal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* 場所 */}
          {game.location && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-2 text-gray-700">📍 会場</h3>
              <p className="text-lg">{game.location}</p>
            </div>
          )}

          {/* メモ */}
          {game.notes && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-2 text-gray-700">📝 メモ</h3>
              <p className="text-lg whitespace-pre-wrap">{game.notes}</p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="bg-gray-50 p-4 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg text-xl-mobile font-bold hover:bg-primary-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
