import { CATEGORIES } from './categories.js';

export const INITIAL_STATE = { stage: 'welcome', categoryIndex: 0, revealed: false };

export function ceremonyReducer(state, action) {
  switch (action.type) {
    case 'start':
      return { stage: 'awards', categoryIndex: 0, revealed: false };
    case 'reveal':
      return state.stage === 'awards' && CATEGORIES[state.categoryIndex].id !== 'honorable'
        ? { ...state, revealed: true } : state;
    case 'next':
      if (state.stage !== 'awards') return state;
      return state.categoryIndex < CATEGORIES.length - 1
        ? { ...state, categoryIndex: state.categoryIndex + 1, revealed: false }
        : { ...state, stage: 'summary', revealed: false };
    case 'previous':
      return state.stage === 'awards' && state.categoryIndex > 0
        ? { ...state, categoryIndex: state.categoryIndex - 1, revealed: false } : state;
    case 'restart':
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}

export const getWinners = (entries = []) => entries[0]?.count > 0
  ? entries.filter(entry => entry.count === entries[0].count) : [];
