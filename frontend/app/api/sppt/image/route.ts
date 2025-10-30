import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

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
    const isMobile = searchParams.get("mobile") === "true";

    // Get additional parameters
    const luasBumi = searchParams.get("luas_bumi") || "0"
    const luasBng = searchParams.get("luas_bng") || "0"
    const njopBumi = searchParams.get("njop_bumi") || "0"
    const njopBng = searchParams.get("njop_bng") || "0"

    // Helper function to format currency
    const formatCurrency = (amount: string) => {
      const num = parseInt(amount) || 0
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(num)
    }

    // Generate HTML content for image conversion
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: white;
            color: black;
            width: 800px;
            height: 1000px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .row {
            display: flex;
            margin-bottom: 8px;
            font-size: 12px;
          }
          .label {
            font-weight: bold;
            width: 100px;
          }
          .value {
            flex: 1;
          }
          .amount {
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            font-size: 10px;
            margin-top: 40px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">SURAT PEMBERITAHUAN PAJAK TERHUTANG</div>
          <div class="subtitle">PAJAK BUMI DAN BANGUNAN</div>
          <div class="subtitle">TAHUN PAJAK ${year}</div>
        </div>

        <div class="section">
          <div class="row">
            <div class="label">NOP:</div>
            <div class="value">${nop}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">DATA WAJIB PAJAK</div>
          <div class="row">
            <div class="label">Nama:</div>
            <div class="value">${name}</div>
          </div>
          <div class="row">
            <div class="label">Alamat:</div>
            <div class="value">${alamat}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">DATA OBJEK PAJAK</div>
          <div class="row">
            <div class="label">Luas Bumi:</div>
            <div class="value">${luasBumi} m²</div>
          </div>
          <div class="row">
            <div class="label">Luas Bangunan:</div>
            <div class="value">${luasBng} m²</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">PERHITUNGAN PAJAK</div>
          <div class="row">
            <div class="label">NJOP Bumi:</div>
            <div class="value">${formatCurrency(njopBumi)}</div>
          </div>
          <div class="row">
            <div class="label">NJOP Bangunan:</div>
            <div class="value">${formatCurrency(njopBng)}</div>
          </div>
          <div class="row">
            <div class="label">PBB yang Harus Dibayar:</div>
            <div class="value amount">${formatCurrency(pbbHarusDibayar)}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">INFORMASI PEMBAYARAN</div>
          <div class="row">
            <div class="label">Status:</div>
            <div class="value">${statusPembayaran}</div>
          </div>
          <div class="row">
            <div class="label">Jatuh Tempo:</div>
            <div class="value">${tglJatuhTempo}</div>
          </div>
        </div>

        <div class="footer">
          Dicetak pada: ${new Date().toLocaleString('id-ID')}
        </div>
      </body>
      </html>
    `;

    // Check if mobile download is requested
    if (isMobile) {
      // For mobile: return HTML content as data URL that can be saved as image
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

      // Save to temporary file for mobile
      const tempDir = join(process.cwd(), "temp");

      // Create temp directory if it doesn't exist
      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true });
      }

      const filename = `sppt-${year}-${nop.replace(/\./g, "")}-${Date.now()}.html`;
      const filePath = join(tempDir, filename);

      await writeFile(filePath, htmlContent);

      // Return download URL
      return NextResponse.json({
        success: true,
        downloadUrl: `/api/sppt/download/${filename}`,
        filename,
        note: "HTML file that can be saved as image using browser's print to image feature"
      });
    } else {
      // Return HTML directly for desktop
      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename=sppt-${year}-${nop.replace(/\./g, "")}.html`,
        },
      });
    }
  } catch (error) {
    console.error('Image generation error:', error)
    return new NextResponse('Failed to generate image', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}