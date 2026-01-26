# PowerShell script to migrate Firestore imports to firestoreCompat

$rootPath = "C:\Users\sflor\Downloads\Fluzio\Fluzio User App"

# Find all TypeScript and TSX files that import from firebase/firestore
$files = Get-ChildItem -Path $rootPath -Include *.ts,*.tsx -Recurse | 
    Where-Object { 
        $_.FullName -notlike "*node_modules*" -and 
        $_.FullName -notlike "*dist*" -and
        $_.FullName -notlike "*build*"
    } |
    Where-Object {
        $content = Get-Content $_.FullName -Raw
        $content -match "from 'firebase/firestore'"
    }

Write-Host "Found $($files.Count) files to migrate" -ForegroundColor Cyan

foreach ($file in $files) {
    Write-Host "`nProcessing: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace firebase/firestore imports with firestoreCompat
    # Determine relative path to services/firestoreCompat
    $filePath = $file.FullName
    
    # Count how many levels deep we are from the root
    $depth = ($filePath.Replace($rootPath, "").Split([IO.Path]::DirectorySeparatorChar) | Where-Object { $_ }).Count - 1
    
    if ($depth -eq 0) {
        $relativePath = "./services/firestoreCompat"
    } else {
        $relativePath = ("../" * $depth) + "services/firestoreCompat"
    }
    
    # Replace the import statement
    $content = $content -replace "from 'firebase/firestore'", "from '$relativePath'"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Updated imports" -ForegroundColor Green
    } else {
        Write-Host "  No changes needed" -ForegroundColor Gray
    }
}

Write-Host "`nMigration complete!" -ForegroundColor Green
Write-Host "Total files processed: $($files.Count)" -ForegroundColor Cyan
