# Payment Automation Script

This script automatically processes payments for employees when they're due.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   - Copy `scripts/.env.example` to `scripts/.env`
   - Set your `PRIVATE_KEY` (admin/owner wallet)
   - Set `PAYROLL_CONTRACT_ADDRESS` (your deployed contract)
   - Set `RPC_URL` (default: local anvil)

3. **Run manually**:
   ```bash
   npm run cron
   ```

## How It Works

1. Connects to the payroll contract
2. Fetches all employees
3. Checks if payment is due (`nextPayTimestamp <= now`)
4. Processes payment for due employees
5. Logs results

## Deployment Options

### Local (Your PC)
- Run `npm run cron` manually when needed
- **Limitation**: Only works when your PC is on

### Cloud Server (24/7)
1. **Railway/Render** (easiest):
   - Deploy as a background worker
   - Add cron schedule in dashboard

2. **DigitalOcean/AWS**:
   - Deploy script to VPS
   - Use crontab: `0 */6 * * * cd /path && npm run cron`

3. **AWS Lambda** (cheapest):
   - Deploy as serverless function
   - Use EventBridge to trigger on schedule

## Example .env

```bash
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
PAYROLL_CONTRACT_ADDRESS=0x00916F572B2101584B01655110EeAC4b1194DA98
RPC_URL=http://127.0.0.1:8545
```

## Security Notes

- **NEVER** commit `.env` to git
- Use a dedicated admin wallet with only payment permissions
- For production, use environment variables in your hosting service
