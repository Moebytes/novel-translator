
import PDFDocument from "@react-pdf/pdfkit"
import functions from "./functions"
import fs from "fs"
import path from "path"

const createPDF = async (imageDir: string, pdfDest?: string, deleteDirectory = true) => {
    const files = fs.readdirSync(imageDir).filter((f) => !f.includes(".DS_Store"))
    .sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)

    const pdf = new PDFDocument({autoFirstPage: false})

    let dest = pdfDest ? pdfDest : `${path.dirname(imageDir)}/${path.basename(imageDir, path.extname(imageDir))}.pdf`

    pdf.pipe(fs.createWriteStream(dest))
    
    for (const file of files) {
        let filepath = path.join(imageDir, file)
        const image = pdf.openImage(filepath)
        pdf.addPage({size: [image.width, image.height]})
        pdf.image(image, 0, 0)
    }

    pdf.end()
    
    if (deleteDirectory) functions.removeDirectory(imageDir)
    return pdfDest
}

export default createPDF