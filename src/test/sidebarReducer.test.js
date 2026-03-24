import sidebarReducer from '../reducer/sidebarReducer';

describe('SidebarReducer', () => {
  test('Phải đảo ngược trạng thái isSidebarOpen khi nhận type TOGGLE_SIDEBAR', () => {
    const initialState = { isSidebarOpen: false };
    const action = { type: 'TOGGLE_SIDEBAR' };
    const state = sidebarReducer(initialState, action);
    expect(state.isSidebarOpen).toBe(true);
  });
});

