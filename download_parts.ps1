$url = "https://www.youtube.com/live/8UK8HugMzeM?si=1XvSQKLnt53E_Z8w"
$format = "bestvideo[height=1440]+bestaudio/bestvideo[height<=1440]+bestaudio/best"
$ffmpeg = "C:\Users\ASUS\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin"
$output_dir = "C:\Users\ASUS\Desktop\new train\video_parts"

New-Item -ItemType Directory -Force -Path $output_dir | Out-Null
Write-Host "Output directory: $output_dir" -ForegroundColor Cyan
Write-Host "Using ffmpeg: $ffmpeg" -ForegroundColor DarkGray

Write-Host "`n[1/3] Downloading Part 1 (0:00:00 - 2:00:00)..." -ForegroundColor Yellow
python -m yt_dlp `
    --download-sections "*0:00:00-2:00:00" `
    -f $format `
    --merge-output-format mp4 `
    --ffmpeg-location $ffmpeg `
    --concurrent-fragments 5 `
    --no-playlist `
    -o "$output_dir\part1.%(ext)s" `
    $url

Write-Host "`n[2/3] Downloading Part 2 (2:00:00 - 4:00:00)..." -ForegroundColor Yellow
python -m yt_dlp `
    --download-sections "*2:00:00-4:00:00" `
    -f $format `
    --merge-output-format mp4 `
    --ffmpeg-location $ffmpeg `
    --concurrent-fragments 5 `
    --no-playlist `
    -o "$output_dir\part2.%(ext)s" `
    $url

Write-Host "`n[3/3] Downloading Part 3 (4:00:00 - END)..." -ForegroundColor Yellow
python -m yt_dlp `
    --download-sections "*4:00:00-inf" `
    -f $format `
    --merge-output-format mp4 `
    --ffmpeg-location $ffmpeg `
    --concurrent-fragments 5 `
    --no-playlist `
    -o "$output_dir\part3.%(ext)s" `
    $url

Write-Host "`nAll parts downloaded successfully!" -ForegroundColor Green
Write-Host "Files saved to: $output_dir" -ForegroundColor Cyan
