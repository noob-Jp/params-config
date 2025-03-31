const express = require('express')
const fs = require('fs').promises
const path = require('path')
const bodyParser = require('body-parser')

const app = express()
const PORT = process.env.PORT || 3000
const PARAMS_DIR = path.join(process.cwd(), 'params')

// 添加调试信息
console.log('当前工作目录:', process.cwd())
console.log('PARAMS_DIR路径:', PARAMS_DIR)
console.log('PARAMS_DIR是否存在:', require('fs').existsSync(PARAMS_DIR))
console.log('PARAMS_DIR/case是否存在:', require('fs').existsSync(path.join(PARAMS_DIR, 'case')))

app.use(bodyParser.json())
app.use(express.static(path.join(process.cwd(), 'dist')))

// 获取案例列表
app.get('/api/cases', async (req, res) => {
  try {
    const casesDir = path.join(PARAMS_DIR, 'case')
    console.log('尝试读取案例目录:', casesDir)
    
    // 检查目录是否存在
    try {
      await fs.access(casesDir)
      console.log('案例目录存在')
    } catch (err) {
      console.error('案例目录不存在:', err.message)
      return res.status(404).json({ error: '案例目录不存在' })
    }
    
    const cases = await fs.readdir(casesDir)
    console.log('读取到案例列表:', cases)
    
    const caseList = await Promise.all(cases.map(async (caseName) => {
      const caseFile = path.join(casesDir, caseName, 'case.json')
      const funcStepPath = path.join(casesDir, caseName, 'function')
      try {
        const caseData = JSON.parse(await fs.readFile(caseFile, 'utf-8'))
        const funcStepData = await fs.readdir(funcStepPath)
        
        return {
          caseName,
          funcStepData,
          functionCount: funcStepData.length ? funcStepData.length : 0
        }
      } catch (err) {
        return {
          caseName,
          functionCount: 0
        }
      }
    }))
    
    res.json(caseList)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 获取单个案例
app.get('/api/cases/:caseName', async (req, res) => {
  try {
    const caseDir = path.join(PARAMS_DIR, 'case', req.params.caseName)
    const caseFile = path.join(caseDir, 'case.json')
    
    // 读取案例基本信息
    try {
      const caseContent = await fs.readFile(caseFile, 'utf-8')
      const caseData = JSON.parse(caseContent)
      res.json(caseData)
      
      console.log(`读取到案例[${req.params.caseName}]基本信息:`, caseData)
    } catch (err) {
      console.log(`读取案例基本信息失败:`, err.message)
    }
  } catch (err) {
    console.error(`获取案例出错:`, err)
    res.status(500).json({ error: err.message })
  }
})

// 获取功能列表
app.get('/api/functions', async (req, res) => {
  try {
    const funcListFile = path.join(PARAMS_DIR, 'funcList.json')
    let funcList = []
    
    try {
      const data = await fs.readFile(funcListFile, 'utf-8')
      funcList = JSON.parse(data)
    } catch (err) {
      // 如果文件不存在或解析失败，返回空数组
      console.log('功能列表文件不存在或解析失败，返回空数组')
    }
    
    res.json(funcList)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 获取功能数据
app.get('/api/cases/:caseName/functions/:functionName', async (req, res) => {
  try {
    console.log(`获取功能数据: 案例=${req.params.caseName}, 功能=${req.params.functionName}`)
    
    const functionFile = path.join(
      PARAMS_DIR, 'case', req.params.caseName, 'function', `${req.params.functionName}.json`
    )
    
    try {
      const functionData = JSON.parse(await fs.readFile(functionFile, 'utf-8'))
      console.log(`读取到功能数据: ${functionData.length}条`)
      res.json(functionData)
    } catch (err) {
      // 如果文件不存在，返回空数组
      console.log(`功能文件不存在或格式错误: ${err.message}`)
      res.json([])
    }
  } catch (err) {
    console.error(`获取功能数据出错:`, err)
    res.status(500).json({ error: err.message })
  }
})

// 内部函数：添加功能到功能列表
async function addFunctionToList(funcKey) {
  if (!funcKey) {
    console.warn('功能键名为空，无法添加到列表')
    return
  }
  
  const funcListFile = path.join(PARAMS_DIR, 'funcList.json')
  
  // 确保funcList.json存在
  try {
    await fs.access(funcListFile)
  } catch (err) {
    // 不存在则创建
    await fs.mkdir(path.dirname(funcListFile), { recursive: true })
    await fs.writeFile(funcListFile, JSON.stringify([], null, 2))
  }
  
  // 读取当前功能列表
  let funcListData = []
  try {
    const content = await fs.readFile(funcListFile, 'utf-8')
    funcListData = JSON.parse(content)
  } catch (err) {
    console.warn(`读取funcList.json失败: ${err.message}`)
  }
  
  // 检查功能是否已存在
  const existingFunc = funcListData.find(f => f.funcKey === funcKey)
  if (!existingFunc) {
    // 添加新功能
    funcListData.push({ funcKey })
    await fs.writeFile(funcListFile, JSON.stringify(funcListData, null, 2))
    console.log(`功能[${funcKey}]已添加到功能列表`)
  } else {
    console.log(`功能[${funcKey}]已存在于列表中`)
  }
}

// 保存功能数据
app.post('/api/cases/:caseName/functions/:functionName', async (req, res) => {
  try {
    console.log(`保存功能数据: 案例=${req.params.caseName}, 功能=${req.params.functionName}`)
    console.log(`请求体数据:`, req.body)
    
    // 验证请求数据
    if (!Array.isArray(req.body)) {
      console.error(`请求数据格式错误: 不是数组`)
      return res.status(400).json({ error: '数据格式错误，应为数组' })
    }
    
    // 首先确保案例目录存在
    const caseDir = path.join(PARAMS_DIR, 'case', req.params.caseName)
    const functionDir = path.join(caseDir, 'function')
    
    // 创建案例和功能目录（如果不存在）
    await fs.mkdir(caseDir, { recursive: true })
    await fs.mkdir(functionDir, { recursive: true })
    
    // 保存功能数据
    const functionFile = path.join(functionDir, `${req.params.functionName}.json`)
    await fs.writeFile(functionFile, JSON.stringify(req.body, null, 2))
    console.log(`功能数据保存成功: ${functionFile}`)
    
    // 同时更新case.json中的功能步骤列表
    const caseFile = path.join(caseDir, 'case.json')
    let caseData = { caseName: req.params.caseName, functions: [] }
    
    try {
      // 读取现有的case.json
      const caseContent = await fs.readFile(caseFile, 'utf-8')
      caseData = JSON.parse(caseContent)
      
      // 确保functions字段存在
      if (!caseData.functions) {
        caseData.functions = []
      }
      
      // 检查功能步骤是否已存在
      const functionIndex = caseData.functions.findIndex(f => f.functionStep === req.params.functionName)
      
      if (functionIndex === -1) {
        // 不存在则添加
        caseData.functions.push({
          funcKey: `func_${req.params.functionName}`,
          functionStep: req.params.functionName,
          preFuncDataMapping: {}
        })
        console.log(`将功能步骤添加到案例: ${req.params.functionName}`)
      } else {
        console.log(`功能步骤已存在于案例中: ${req.params.functionName}`)
      }
      
      // 保存更新后的case.json
      await fs.writeFile(caseFile, JSON.stringify(caseData, null, 2))
      console.log(`更新案例文件成功: ${caseFile}`)
    } catch (err) {
      // 如果case.json不存在，创建一个新的
      console.log(`案例文件不存在，创建新文件: ${err.message}`)
      caseData = {
        caseName: req.params.caseName,
        functions: [{
          funcKey: `func_${req.params.functionName}`,
          functionStep: req.params.functionName,
          preFuncDataMapping: {}
        }]
      }
      await fs.writeFile(caseFile, JSON.stringify(caseData, null, 2))
      console.log(`创建新案例文件成功: ${caseFile}`)
    }
    
    // 更新功能列表
    try {
      if (req.body.length > 0) {
        await addFunctionToList(`func_${req.params.functionName}`)
      }
    } catch (err) {
      console.warn(`更新功能列表失败: ${err.message}`)
    }
    
    res.json({ success: true })
  } catch (err) {
    console.error(`保存功能数据出错:`, err)
    res.status(500).json({ error: err.message })
  }
})

// 获取钩子代码
app.get('/api/cases/:caseName/hooks/:hookName/:type', async (req, res) => {
  try {
    const hookFile = path.join(
      PARAMS_DIR, 'case', req.params.caseName, 'hooks', req.params.hookName, `${req.params.type}.js`
    )
    try {
      const hookCode = await fs.readFile(hookFile, 'utf-8')
      res.send(hookCode)
    } catch (err) {
      res.send('')
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 保存钩子代码
app.post('/api/cases/:caseName/hooks/:hookName/:type', async (req, res) => {
  try {
    const hookDir = path.join(PARAMS_DIR, 'case', req.params.caseName, 'hooks', req.params.hookName)
    await fs.mkdir(hookDir, { recursive: true })
    
    const hookFile = path.join(hookDir, `${req.params.type}.js`)
    await fs.writeFile(hookFile, req.body.code)
    
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 添加新功能到功能列表
app.post('/api/functions', async (req, res) => {
  try {
    const { funcKey } = req.body
    if (!funcKey) {
      return res.status(400).json({ error: '功能键名不能为空' })
    }
    
    await addFunctionToList(funcKey)
    
    res.json({ success: true })
  } catch (err) {
    console.error(`添加功能到列表失败:`, err)
    res.status(500).json({ error: err.message })
  }
})

// 保存整个功能列表
app.post('/api/functions/save-all', async (req, res) => {
  try {
    const funcList = req.body
    if (!Array.isArray(funcList)) {
      return res.status(400).json({ error: '功能列表必须是数组' })
    }
    
    // 简单验证每个功能项
    for (const func of funcList) {
      if (!func.funcKey) {
        return res.status(400).json({ error: '功能键名不能为空' })
      }
    }
    
    // 保存到文件
    const funcListFile = path.join(PARAMS_DIR, 'funcList.json')
    await fs.writeFile(funcListFile, JSON.stringify(funcList, null, 2))
    
    console.log(`功能列表已更新，共${funcList.length}条记录`)
    res.json({ success: true, count: funcList.length })
  } catch (err) {
    console.error(`保存功能列表失败:`, err)
    res.status(500).json({ error: err.message })
  }
})

// 保存案例
app.post('/api/cases', async (req, res) => {
  try {
    const { caseName, functions } = req.body
    
    if (!caseName) {
      return res.status(400).json({ error: '案例名称不能为空' })
    }
    
    console.log('保存案例:', { caseName, functionCount: functions ? functions.length : 0 })
    
    const caseDir = path.join(PARAMS_DIR, 'case', caseName)
    const functionsDir = path.join(caseDir, 'function')
    const hooksDir = path.join(caseDir, 'hooks')
    
    await fs.mkdir(caseDir, { recursive: true })
    await fs.mkdir(functionsDir, { recursive: true })
    await fs.mkdir(hooksDir, { recursive: true })
    
    // 直接保存functions数组
    const caseFile = path.join(caseDir, 'case.json')
    await fs.writeFile(caseFile, JSON.stringify(functions || [], null, 2))
    
    let existingFunctionFiles = []
    try {
      existingFunctionFiles = await fs.readdir(functionsDir)
    } catch (err) {
      console.log('读取功能目录失败:', err.message)
    }
    
    if (functions && functions.length > 0) {
      for (const func of functions) {
        if (func.functionStep) {
          const functionFile = path.join(functionsDir, `${func.functionStep}.json`)
          
          if (!existingFunctionFiles.includes(`${func.functionStep}.json`)) {
            console.log(`创建新功能文件: ${func.functionStep}.json`)
            await fs.writeFile(functionFile, JSON.stringify([], null, 2))
          }
        }
      }
    }
    
    // 删除不再使用的功能文件
    try {
      for (const file of existingFunctionFiles) {
        if (file.endsWith('.json')) {
          const stepName = file.replace('.json', '')
          const isStepInFunctions = functions.some(f => f.functionStep === stepName)
          
          if (!isStepInFunctions) {
            const fileToDelete = path.join(functionsDir, file)
            try {
              await fs.unlink(fileToDelete)
              console.log(`删除不再使用的功能文件: ${file}`)
            } catch (err) {
              console.warn(`删除功能文件失败: ${file}`, err)
            }
          }
        }
      }
    } catch (err) {
      console.warn(`清理功能文件失败:`, err)
    }
    
    if (functions && functions.length > 0) {
      const funcListFile = path.join(PARAMS_DIR, 'funcList.json')
      
      let funcList = [];
      try {
        const funcListFileContent = await fs.readFile(funcListFile, 'utf-8')
        funcList = JSON.parse(funcListFileContent)
      } catch (err) {
        await fs.mkdir(path.dirname(funcListFile), { recursive: true })
      }
      
      let updated = false;
      functions.forEach(func => {
        if (func.funcKey && !funcList.some(f => f.funcKey === func.funcKey)) {
          funcList.push({ funcKey: func.funcKey })
          updated = true;
        }
      })
      
      if (updated) {
        await fs.writeFile(funcListFile, JSON.stringify(funcList, null, 2))
      }
    }
    
    res.json({ success: true, caseName })
  } catch (err) {
    console.error('保存案例出错:', err)
    res.status(500).json({ error: err.message })
  }
})

// 删除案例
app.delete('/api/cases/:caseName', async (req, res) => {
  try {
    const caseDir = path.join(PARAMS_DIR, 'case', req.params.caseName)
    await fs.rm(caseDir, { recursive: true })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 导出功能列表JSON
app.get('/api/export/functions', async (req, res) => {
  try {
    const funcListFile = path.join(PARAMS_DIR, 'funcList.json')
    
    // 检查文件是否存在
    try {
      await fs.access(funcListFile)
    } catch (err) {
      return res.status(404).json({ error: 'funcList.json文件不存在' })
    }
    
    // 读取文件内容
    const fileContent = await fs.readFile(funcListFile, 'utf-8')
    
    // 设置响应头，指示浏览器下载文件
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=funcList.json`)
    
    // 发送文件内容
    res.send(fileContent)
  } catch (err) {
    console.error(`导出功能列表失败:`, err)
    res.status(500).json({ error: err.message })
  }
})

// 导出单个case.json文件
app.get('/api/export/case/:caseName/json', async (req, res) => {
  try {
    const caseFile = path.join(PARAMS_DIR, 'case', req.params.caseName, 'case.json')
    
    // 检查文件是否存在
    try {
      await fs.access(caseFile)
    } catch (err) {
      return res.status(404).json({ error: `案例${req.params.caseName}不存在` })
    }
    
    // 设置响应头，指示浏览器下载文件
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.caseName}_case.json`)
    
    // 读取文件并发送
    const fileContent = await fs.readFile(caseFile, 'utf-8')
    res.send(fileContent)
  } catch (err) {
    console.error(`导出案例JSON失败:`, err)
    res.status(500).json({ error: err.message })
  }
})

// 导出单个function步骤
app.get('/api/export/case/:caseName/function/:functionName', async (req, res) => {
  try {
    const functionFile = path.join(
      PARAMS_DIR, 'case', req.params.caseName, 'function', `${req.params.functionName}.json`
    )
    
    // 检查文件是否存在
    try {
      await fs.access(functionFile)
    } catch (err) {
      return res.status(404).json({ error: `功能步骤${req.params.functionName}不存在` })
    }
    
    // 设置响应头，指示浏览器下载文件
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.functionName}.json`)
    
    // 读取文件并发送
    const fileContent = await fs.readFile(functionFile, 'utf-8')
    res.send(fileContent)
  } catch (err) {
    console.error(`导出功能步骤失败:`, err)
    res.status(500).json({ error: err.message })
  }
})

// 导出整个case文件夹（压缩为zip文件）
app.get('/api/export/case/:caseName', async (req, res) => {
  try {
    const { caseName } = req.params
    const caseDir = path.join(PARAMS_DIR, 'case', caseName)
    
    // 检查案例目录是否存在
    try {
      await fs.access(caseDir)
    } catch (err) {
      return res.status(404).json({ error: `案例${caseName}不存在` })
    }
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename=${caseName}.zip`)
    
    // 创建临时目录用于存放zip文件
    const tmpDir = path.join(__dirname, 'tmp')
    await fs.mkdir(tmpDir, { recursive: true })
    const zipFile = path.join(tmpDir, `${caseName}.zip`)
    
    // 使用child_process执行zip命令
    const { exec } = require('child_process')
    
    const zipCommand = process.platform === 'win32'
      ? `powershell Compress-Archive -Path "${caseDir}/*" -DestinationPath "${zipFile}" -Force`
      : `zip -r "${zipFile}" "${caseDir}"`;
    
    exec(zipCommand, async (error) => {
      if (error) {
        console.error(`压缩案例目录失败:`, error)
        return res.status(500).json({ error: '压缩案例目录失败' })
      }
      
      // 发送zip文件
      res.download(zipFile, `${caseName}.zip`, async (err) => {
        if (err) {
          console.error(`发送zip文件失败:`, err)
        }
        
        // 下载完成后删除临时文件
        try {
          await fs.unlink(zipFile)
        } catch (e) {
          console.error(`删除临时zip文件失败:`, e)
        }
      })
    })
  } catch (err) {
    console.error(`导出案例目录失败:`, err)
    res.status(500).json({ error: err.message })
  }
})

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
}) 