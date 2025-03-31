module.exports = async ({ page, preFuncData, next, break: breakLoop }) => {
  // 在这里实现前置逻辑
  page.logger.log('执行前置处理...');
    
  // 示例：根据条件决定流程控制
  const condition = false; // 这里可以根据实际逻辑判断

  if (condition) {
    page.logger.log('终止整个流程');
    breakLoop();
    return;
  }

  // 示例：如果需要修改数据并继续执行下一步
  if (!condition) {
    page.logger.log('流程继续执行，传递新数据到下一步');
    next({
      someNewData: 'value',
      ...preFuncData
    });
    return;
  }

  // 示例：使用传统方式继续执行（向后兼容）
  // return false; // 终止执行
  return true; // 继续执行
};
