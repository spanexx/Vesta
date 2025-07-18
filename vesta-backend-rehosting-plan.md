# Vesta Backend Rehosting Plan (Oracle Cloud)

## 1. Prerequisites
- Oracle Cloud VM running Ubuntu (IP: 141.253.105.251)
- SSH access with private key: `ssh-key-2025-07-17.key`
- Node.js, npm, and git installed on VM

## 2. Transfer Backend Code
- Option 1: Use SCP to copy `vestaBackend` folder:
  ```powershell
  scp -i "C:\Users\shuga\OneDrive\Desktop\PRO\Advanced\ssh-key-2025-07-17.key" -r c:\Users\shuga\OneDrive\Desktop\PRO\Vesta\vestaBackend ubuntu@141.253.105.251:~/
  ```
- Option 2: Push to GitHub and clone on VM:
  ```sh
  git clone <your-repo-url>
  ```

## 3. Install Dependencies
- SSH into VM:
  ```sh
  ssh -i "ssh-key-2025-07-17.key" ubuntu@141.253.105.251
  cd ~/vestaBackend
  npm install
  ```

## 4. Configure Environment
- Set up environment variables and config files (e.g., `config.js`).
- Update secrets and production settings as needed.

## 5. Start Backend Server
- Start with Node.js or PM2:
  ```sh
  node server.js
  # or
  pm2 start server.js
  pm2 save
  ```

## 6. Open Firewall Ports
- Allow traffic on backend port (e.g., 3000):
  ```sh
  sudo ufw allow 3000
  sudo ufw enable
  ```

## 7. Test Deployment
- Access backend at `http://141.253.105.251:<port>`
- Verify API and service functionality

## 8. (Optional) Set Up Reverse Proxy
- Use Nginx or Apache for HTTPS and routing

---
**Reference:**
- Credentials: See `credential.d`
- VM: Ubuntu, 16GB RAM, 1 OCPU, eu-paris-1
