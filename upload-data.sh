for file in /mnt/mountpoint/Rich-Spot-Historical-Data-Backup/*.gz; do
  echo "Uploading $file"
  node ./server/bin/upload-data.js "$file" 
done
