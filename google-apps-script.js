/**
 * GOOGLE APPS SCRIPT - PENYIMPANAN BERKAS DUTA KAMPUS UIN SSC 2026
 * 
 * Petunjuk Penggunaan:
 * 1. Buka https://script.google.com/
 * 2. Klik "New Project" (Proyek Baru)
 * 3. Hapus kode bawaan dan tempelkan seluruh kode ini.
 * 4. Ganti DEFAULT_FOLDER_ID di bawah dengan ID Folder Google Drive Anda (opsional, jika tidak diisi akan otomatis membuat folder baru).
 * 5. Klik "Deploy" -> "New deployment"
 * 6. Pilih jenis: "Web app"
 * 7. Setting:
 *    - Execute as: "Me (email Anda)"
 *    - Who has access: "Anyone" (Siapa saja, penting agar pelamar & web dapat mengunggah berkas)
 * 8. Klik "Deploy" dan izinkan hak akses Google Drive.
 * 9. Salin "Web app URL" (format: https://script.google.com/macros/s/.../exec)
 * 10. Tempelkan URL tersebut ke Pengaturan Penyimpanan di Panel Admin website.
 */

// Ganti dengan ID Folder Google Drive Anda, atau biarkan kosong agar dibuatkan otomatis
var DEFAULT_FOLDER_NAME = "Berkas Pendaftaran Duta Kampus UIN SSC 2026";
var DEFAULT_FOLDER_ID = ""; 

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Google Apps Script Penyimpanan Berkas Duta Kampus UIN SSC 2026 Aktif & Siap Digunakan.",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ success: false, error: "Tidak ada data yang dikirim." });
    }

    var request = JSON.parse(e.postData.contents);
    var action = request.action || "upload";

    // 1. TEST KONEKSI
    if (action === "test") {
      var targetFolder = getTargetFolder(request.folderId);
      return responseJSON({
        success: true,
        message: "Koneksi Google Drive berhasil!",
        folderId: targetFolder.getId(),
        folderName: targetFolder.getName(),
        folderUrl: targetFolder.getUrl()
      });
    }

    // 2. HAPUS BERKAS DARI GOOGLE DRIVE (DELETE)
    if (action === "delete") {
      if (!request.fileId) {
        return responseJSON({ success: false, error: "fileId diperlukan untuk menghapus berkas." });
      }
      try {
        var fileToDelete = DriveApp.getFileById(request.fileId);
        fileToDelete.setTrashed(true); // Pindahkan ke Sampah Google Drive
        return responseJSON({ success: true, message: "Berkas berhasil dihapus dari Google Drive." });
      } catch (err) {
        return responseJSON({ success: false, error: "Gagal menghapus berkas: " + err.toString() });
      }
    }

    // 3. UNGGAH BERKAS KE GOOGLE DRIVE (CREATE / UPDATE)
    if (action === "upload") {
      if (!request.base64Data || !request.fileName) {
        return responseJSON({ success: false, error: "base64Data dan fileName wajib diisi." });
      }

      var mainFolder = getTargetFolder(request.folderId);
      
      // Buat subfolder terpisah untuk setiap pelamar agar berkas rapi & terorganisir
      var applicantFolderName = (request.applicantName || "Peserta") + " - " + (request.applicantNim || request.applicantEmail || "Dokumen");
      applicantFolderName = applicantFolderName.replace(/[\/\\:*?"<>|]/g, "_"); // Bersihkan karakter ilegal
      
      var applicantFolder;
      var existingFolders = mainFolder.getFoldersByName(applicantFolderName);
      if (existingFolders.hasNext()) {
        applicantFolder = existingFolders.next();
      } else {
        applicantFolder = mainFolder.createFolder(applicantFolderName);
      }

      // Hapus berkas lama dengan nama/label yang sama jika ada (fitur Update/Edit)
      if (request.docKey) {
        var oldFiles = applicantFolder.getFiles();
        while (oldFiles.hasNext()) {
          var f = oldFiles.next();
          if (f.getName().indexOf(request.docKey) !== -1 || f.getName() === request.fileName) {
            f.setTrashed(true);
          }
        }
      }

      // Decode Base64 data
      var rawBase64 = request.base64Data;
      if (rawBase64.indexOf("base64,") !== -1) {
        rawBase64 = rawBase64.split("base64,")[1];
      }

      var decoded = Utilities.base64Decode(rawBase64);
      var mimeType = request.mimeType || "application/pdf";
      var blob = Utilities.newBlob(decoded, mimeType, request.fileName);

      // Simpan berkas ke Google Drive
      var file = applicantFolder.createFile(blob);

      // Beri izin akses view agar dapat dipratinjau di website
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      var fileId = file.getId();
      var viewUrl = file.getUrl();
      var previewUrl = "https://drive.google.com/file/d/" + fileId + "/preview";
      var directDownloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;

      return responseJSON({
        success: true,
        fileId: fileId,
        fileName: file.getName(),
        mimeType: mimeType,
        sizeBytes: file.getSize(),
        viewUrl: viewUrl,
        previewUrl: previewUrl,
        downloadUrl: directDownloadUrl,
        folderId: applicantFolder.getId(),
        folderUrl: applicantFolder.getUrl(),
        uploadedAt: new Date().toISOString()
      });
    }

    return responseJSON({ success: false, error: "Action tidak dikenali." });

  } catch (error) {
    return responseJSON({ success: false, error: error.toString() });
  }
}

function getTargetFolder(specifiedFolderId) {
  var folderId = specifiedFolderId || DEFAULT_FOLDER_ID;
  if (folderId && folderId.trim() !== "") {
    try {
      return DriveApp.getFolderById(folderId.trim());
    } catch (e) {}
  }

  // Jika folder ID tidak ditemukan atau kosong, cari/buat folder default
  var folders = DriveApp.getFoldersByName(DEFAULT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(DEFAULT_FOLDER_NAME);
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
