module.exports = async ({ page, preFuncData, finishWorkFlowData = [], next, break: breakLoop }) => {
  page.logger.log('执行后置处理...');

  const finishWorkFlowDataLast = finishWorkFlowData.slice(-1)[0];
  const c_unit_code = preFuncData.C_UNIT_CODE;
  const breakFlag = `OURE Print [${c_unit_code}]`;

  page.logger.log(finishWorkFlowDataLast);

  const condition = finishWorkFlowDataLast && finishWorkFlowDataLast?.text === breakFlag; 
  
  page.logger.log('finishWorkFlowDataLast.text', finishWorkFlowDataLast.text);

  page.logger.log('breakFlag', breakFlag);
  
  // 在这里实现后置逻辑
  // ... 具体的后置逻辑
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
  }
}; 
