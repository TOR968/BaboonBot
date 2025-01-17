# Baboon Bot

| ✅  | Feature                     |
| --- | --------------------------- |
| ✅  | Daily rewards automation    |
| ✅  | Multiple account support    |
| ✅  | Proxy support (SOCKS/HTTP)  |
| ✅  | Quest automation            |
| ✅  | Battery management          |
| ✅  | User-Agent rotation         |
| ✅  | Scheduled runs              |

## For suggestions or to report a bug, please contact [telegram](https://t.me/tor_dev)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/TOR968/BaboonBot.git
    cd BaboonBot
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Configure your accounts in `data.txt`:
    ```
    account_1_tgInitData
    account_2_tgInitData
    account_3_tgInitData
    ```

4. (Optional) Add proxies to `proxy.txt`:
    ```
    socks5://user:pass@host:port
    http://user:pass@host:port
    ```

5. Adjust settings in `config.json`:
    ```json
    {
        "processBatteryTaps": false, // true/false Enable or disable the execution of battery taps
        "maxCyclesPerSession": 2, // number of cycles of the battery state from 100% health to 0%, after which it 
                                 // is repaired and restarted
        "processQuests": true, // true/false Enable or disable the execution of tasks;
        "processDailyCombo": true, // true/false Enable or disable the execution of daily combo;
        "combo": { // Example of daily combo values in % / Must be changed daily;
            "battery1": 9.244791666666668, // 1-100;
            "battery2": 36.865234375, // 1-100;
            "battery3": 99.658203125 // 1-100;
        }
    }
    ```

## How to Get tgInitData

1. Open the game in Telegram or Browser
2. Open Developer Tools (F12)
3. Go to Network tab
4. Look for the `tgWabAppData` parameter
5. Copy the entire value and paste it in `data.txt`

![How to get tgInitData](./img/initParams.png)

## Usage

Run the bot with:
```bash
node index.js
```

## Disclaimer

This bot is for educational purposes only. Use at your own risk and responsibility.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

