import {connect} from "puppeteer-real-browser"
import {execSync} from "child_process"
import functions from "./functions"
import fs from "fs"
import os from "os"
import path from "path"

const translateImages = async (imageDir: string, destFolder?: string, targetLang = "en", deleteDirectory = true) => {
    if (!destFolder) destFolder = path.join(path.dirname(imageDir), `frames-${targetLang}`)
    if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, {recursive: true})

    const {page, browser} = await connect({headless: false, turnstile: true})

    let url = `https://translate.google.com/?sl=ja&tl=${targetLang}&op=images`

    const context = browser.defaultBrowserContext()
    await context.overridePermissions(url, ["clipboard-read", "clipboard-write"])
    await page.goto(url, {waitUntil: "networkidle2", timeout: 120000})

    const downloadFolder = path.join(os.homedir(), "Downloads")
    const client = await page.createCDPSession()

    await client.send("Browser.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: downloadFolder
    })

    const files = fs.readdirSync(imageDir).filter((f) => !f.includes(".DS_Store"))
    .sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)

    for (const file of files) {
        const filepath = path.join(imageDir, file)
        const ext = path.extname(filepath).toLowerCase()

        let clipboard = false 
        let filename = clipboard ? `translated_image_${targetLang}.png` : path.basename(filepath)

        if (clipboard) {
            if (process.platform === "darwin") {
                execSync(`osascript -e 'set the clipboard to (read (POSIX file "${filepath}") as picture)'`)
            } else if (process.platform === "win32") {
                execSync(`powershell -NoProfile -Command "
                    Add-Type -AssemblyName System.Windows.Forms;
                    Add-Type -AssemblyName System.Drawing;
                    $img = [System.Drawing.Image]::FromFile('${filepath}');
                    [System.Windows.Forms.Clipboard]::SetImage($img);"`)
            } else {
                execSync(`wl-copy < "${filepath}"`)
            }

            const pasteBtnSelector = `button[aria-label="Paste an image from clipboard"]`
            await page.waitForSelector(pasteBtnSelector)
            await page.click(pasteBtnSelector)
        } else {
            const fileBtnSelector = `button[aria-label="Browse your files"]`
            await page.waitForSelector(fileBtnSelector)
            const fileInput = await page.waitForSelector('input[type="file"][accept*="image/png"]')
            if (!fileInput) continue
            await fileInput.uploadFile(filepath)
        }

        const downloadBtn = `button[aria-label="Download translation"]`
        await page.waitForSelector(downloadBtn, {timeout: 100000})

        await page.evaluate(selector => {
            const btn = document.querySelector(selector)
            if (btn) (btn as any).click()
        }, downloadBtn)

        await functions.timeout(3000)

        const clearBtn = `button[aria-label="Clear image"]`
        await page.evaluate(selector => {
            const btn = document.querySelector(selector)
            if (btn) (btn as any).click()
        }, clearBtn)

        let downloadFolder = path.join(os.homedir(), "Downloads")
        const translatedFile = path.join(downloadFolder, filename)
        const targetDest = path.join(destFolder, path.basename(filepath, ext) + ".png")

        fs.renameSync(translatedFile, targetDest)
    }
    
    await browser.close()

    if (deleteDirectory) functions.removeDirectory(imageDir)
    return destFolder
}

export default translateImages