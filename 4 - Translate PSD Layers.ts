import fs from "fs"
import {readPsd, writePsd, initializeCanvas} from "ag-psd"
import {createCanvas, ImageData} from "@napi-rs/canvas"

initializeCanvas(
    // @ts-ignore
    (width, height) => createCanvas(width, height),
    (width, height) => new ImageData(width, height)
)

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const translate = async (word: string) => {
    try {
        if (!word) return word
        let headers = {Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`, "Content-Type": "application/json"}
        let body = JSON.stringify({text: [word.trim()], target_lang: "EN"})
        const result = await fetch(`https://api-free.deepl.com/v2/translate`, {method: "POST", headers, body}).then((r) => r.json())
        return result.translations?.[0]?.text ?? word
    } catch {
        return word
    }
}

const translatePSDLayers = async (psdFile: string, outFile: string) => {
    const psd = readPsd(fs.readFileSync(psdFile))

    const translateLayers = async (layers: NonNullable<typeof psd.children>) => {
        for (const layer of layers) {
            if (layer.name?.trim()) {
                await delay(300)
                const originalName = layer.name
                layer.name = await translate(layer.name)
                console.log(`"${originalName}" -> "${layer.name}"`)
            }

            if (layer.children?.length) {
                await translateLayers(layer.children)
            }
        }
    }

    if (psd.children?.length) {
        await translateLayers(psd.children)
    }

    const output = writePsd(psd)
    fs.writeFileSync(outFile, Buffer.from(output))
}

export default translatePSDLayers