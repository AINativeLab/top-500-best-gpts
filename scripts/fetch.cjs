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

const formater = new Intl.NumberFormat("en-US", {
  notation: 'compact'
})

const ensureDirectoryExists = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true })
  }
}

;(async () => {
  const sql =
    'select id, name, logo, chats, categories, review_average from gpt where is_404 = false order by chats desc, created_at desc limit 500'
  const list = await db.execute(sql)

  const homeHeader = `# Top 500 Best GPTs on the GPT Store

  This project daily scrapes and archives data from the official GPT Store. If you have other data requirements, please open an issue.
  
  <p align="center">
  ★ Powered by <a target="_blank" href="https://www.gptshunter.com/?utm_source=top-500-best-gpts">GPTsHunter.com</a> ★
  </p>
  
  <p align="center">
    <a target="_blank" href="https://gptshunter.com/?utm_source=top-500-best-gpts">
      <img alt="GPTsHunter" src="https://gptshunter.com/full-logo.svg" width="300">
    </a>
  </p>
  
`

const homeTitle =  `## Top 500 Best GPTs Ranked by conversations(${today})`
 
const archiveTitle = homeTitle.replace('##', '#')

const md = `
${list.rows
    .map((one, index) => {
      return `
[<img align="left" height="48px" width="48px" style="border-radius:50%" alt="${
        one.name
      }" src="${one.logo}"/>](https://chat.openai.com/g/${one.id}?ref=gptshunter)

[**${one.name}**](https://chat.openai.com/g/${one.id}?ref=gptshunter) \\
No.${index + 1} ${one.chats ? '/' : ''} ${formater.format(one.chats)} ${one.review_average ? '/ ★' : ''} ${one.review_average ? (one.review_average * 1).toFixed(1) : ''}
    `
    })
    .join('\n')}`

  ensureDirectoryExists(path.join(__dirname, `../archive/${today}/`))
  fs.writeFileSync(path.join(__dirname, `../archive/${today}/README.MD`), archiveTitle + md)
  fs.writeFileSync(
    path.join(__dirname, `../archive/${today}/raw.json`),
    JSON.stringify(list.rows.map(one => {
      const _one = { ...one }
      delete _one.logo
      if (_one.categories) {
        _one.categories = JSON.parse(_one.categories)
      }
      return _one
    }), null, 2)
  )
  fs.writeFileSync(path.join(__dirname, '../README.MD'), homeHeader + homeTitle + md)
})()
