/**
 * 时间表视图布局配置
 * 
 * 集中管理所有与尺寸相关的配置变量
 * 修改这些变量即可整体调整布局
 */

/**
 * 桌号列宽度（左侧固定列）
 * 默认: 30px
 * 
 * 修改此变量可调整桌号列的宽度
 */
export const TABLE_COLUMN_WIDTH = 30;

/**
 * 时间格宽度（中间网格区域）
 * 固定: 64px
 * 
 * 修改此变量可调整时间格的宽度
 */
export const TIME_SLOT_WIDTH = 64;

/**
 * 获取行高
 * 
 * 规则：
 * - 最小行高: 40px (mobile)
 * - 默认行高: 44px
 * - 最大行高: 48px
 * - 当屏幕高度 < 700px 时，使用 40px
 * 
 * @returns 当前应使用的行高（单位：px）
 */
export const getRowHeight = (): number => {
  if (typeof window === 'undefined') {
    return 44; // SSR 默认值
  }
  
  const screenHeight = window.innerHeight;
  
  if (screenHeight < 700) {
    return 40; // 小屏幕使用最小行高
  }
  
  return 44; // 默认行高
};

/**
 * 行高常量（用于非响应式场景）
 * 默认: 44px
 */
export const DEFAULT_ROW_HEIGHT = 44;

/**
 * 最小行高
 */
export const MIN_ROW_HEIGHT = 40;

/**
 * 最大行高
 */
export const MAX_ROW_HEIGHT = 48;
