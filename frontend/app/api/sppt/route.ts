import { type NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // Get parameters
    const year = searchParams.get("year") || new Date().getFullYear().toString()
    const nop = searchParams.get("nop") || ""
    const name = searchParams.get("name") || ""
    const alamat = searchParams.get("jln_wp") || ""
    const pbbHarusDibayar = searchParams.get("pbb_harus_dibayar") || "0"
    const statusPembayaran = searchParams.get("status_pembayaran") || "BELUM LUNAS"
    const tglJatuhTempo = searchParams.get("tgl_jatuh_tempo") || ""

    // Create PDF document
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Helper function to draw text
    const drawText = (text: string, x: number, y: number, options: { size?: number; font?: typeof font; color?: [number, number, number] } = {}) => {
      const {
        size = 12,
        font: textFont = font,
        color = [0, 0, 0],
      } = options

      page.drawText(text, {
        x,
        y,
        size,
        font: textFont,
        color: rgb(...color),
      })
    }

    // Helper to format currency
    const formatCurrency = (amount: string) => {
      const num = parseInt(amount) || 0
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(num)
    }

    let currentY = height - 50

    // Title
    drawText("SURAT PEMBERITAHUAN PAJAK TERHUTANG", width / 2 - 150, currentY, { size: 14, font: boldFont })
    currentY -= 25
    drawText("PAJAK BUMI DAN BANGUNAN", width / 2 - 80, currentY, { size: 12, font: boldFont })
    currentY -= 25
    drawText(`TAHUN PAJAK ${year}`, width / 2 - 40, currentY, { size: 12, font: boldFont })
    currentY -= 40

    // NOP
    drawText("NOP:", 50, currentY, { font: boldFont })
    drawText(nop, 100, currentY)
    currentY -= 30

    // Data Wajib Pajak Section
    drawText("DATA WAJIB PAJAK", 50, currentY, { font: boldFont, size: 11 })
    currentY -= 20
    drawText("Nama:", 50, currentY, { font: boldFont })
    drawText(name, 150, currentY)
    currentY -= 20
    drawText("Alamat:", 50, currentY, { font: boldFont })
    drawText(alamat, 150, currentY)
    currentY -= 40

    // Data Objek Pajak Section
    drawText("DATA OBJEK PAJAK", 50, currentY, { font: boldFont, size: 11 })
    currentY -= 20
    const luasBumi = searchParams.get("luas_bumi") || "0"
    const luasBng = searchParams.get("luas_bng") || "0"
    drawText("Luas Bumi:", 50, currentY, { font: boldFont })
    drawText(`${luasBumi} m²`, 150, currentY)
    currentY -= 20
    drawText("Luas Bangunan:", 50, currentY, { font: boldFont })
    drawText(`${luasBng} m²`, 150, currentY)
    currentY -= 40

    // Perhitungan Pajak Section
    drawText("PERHITUNGAN PAJAK", 50, currentY, { font: boldFont, size: 11 })
    currentY -= 20
    const njopBumi = searchParams.get("njop_bumi") || "0"
    const njopBng = searchParams.get("njop_bng") || "0"
    drawText("NJOP Bumi:", 50, currentY, { font: boldFont })
    drawText(formatCurrency(njopBumi), 150, currentY)
    currentY -= 20
    drawText("NJOP Bangunan:", 50, currentY, { font: boldFont })
    drawText(formatCurrency(njopBng), 150, currentY)
    currentY -= 30
    drawText("PBB yang Harus Dibayar:", 50, currentY, { font: boldFont })
    drawText(formatCurrency(pbbHarusDibayar), 200, currentY, { font: boldFont, size: 14 })
    currentY -= 40

    // Informasi Pembayaran Section
    drawText("INFORMASI PEMBAYARAN", 50, currentY, { font: boldFont, size: 11 })
    currentY -= 20
    drawText("Status:", 50, currentY, { font: boldFont })
    drawText(statusPembayaran, 100, currentY)
    currentY -= 20
    drawText("Jatuh Tempo:", 50, currentY, { font: boldFont })
    drawText(tglJatuhTempo, 150, currentY)
    currentY -= 40

    // Footer
    drawText("Dicetak pada: " + new Date().toLocaleString('id-ID'), 50, currentY, { size: 10 })

    // Save PDF
    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=sppt-${year}-${nop.replace(/\./g, "")}.pdf`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return new NextResponse('Failed to generate PDF', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}
