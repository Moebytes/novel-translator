import "dotenv/config"
import extractPDFImages from "./1 - Extract PDF images"
import googleTranslateImages from "./2 - Google translate images"
import convertToPDF from "./3 - Convert to PDF"
import translatePSDLayers from "./4 - Translate PSD Layers"
import path from "path"

const translatePDF = async (pdf: string, dest: string) => {
    const imageFolder = await extractPDFImages(pdf)
    const translatedImageFolder = await googleTranslateImages(imageFolder)
    await convertToPDF(translatedImageFolder, dest)
}

let src = path.join(__dirname, "../src/1.pdf")
let dest = path.join(__dirname, "../dest/1.pdf")

translatePDF(src, dest)