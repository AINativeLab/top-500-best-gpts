const fs = require('fs')
const path = require('path')
const { createClient } = require('@libsql/client')
const utc = require('dayjs/plugin/utc')
const dayjs = require('dayjs')

dayjs.extend(utc)

const today = dayjs.utc().format('YYYY-MM-DD')

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN
})

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true })
  }
}

;(async () => {
  const sql =
    'select id, name, logo, chats, categories from gpt where is_404 = false order by chats desc, created_at desc limit 500'
  const list = await db.execute(sql)

  let md = `# Top 500 GPTs on the GPT Store

  This project daily scrapes and archives data from the official GPT Store. If you have other data requirements, please open an issue.
  
  <p align="center">
  Powered by
  </p>
  
  <p align="center">
    <a target="_blank" href="https://gptshunter.com/?utm_source=top-500-best-gpts">
      <img alt="GPTsHunter" src="https://gptshunter.com/full-logo.svg" width="300">
    </a>
  </p>
  
## Top 500 GPTs Ranked by conversations(${today})

`

  md += `${list.rows
    .map((one, index) => {
      return `
[<img align="left" height="48px" width="48px" style="border-radius:50%" alt="${
        one.name
      }" src="${one.logo}"/>](${one.id})

[**${one.name}**](${one.id}) \\
No.${index + 1} ${one.chats ? '/' : ''} ${one.chats}
    `
    })
    .join('\n')}`

  ensureDirectoryExists(path.join(__dirname, `../archive/${today}/`))
  fs.writeFileSync(path.join(__dirname, `../archive/${today}/README.MD`), md)
  fs.writeFileSync(
    path.join(__dirname, `../archive/${today}/raw.json`),
    JSON.stringify(list.rows, null, 2)
  )
  fs.writeFileSync(path.join(__dirname, '../README.MD'), md)
})()
