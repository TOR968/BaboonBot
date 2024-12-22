const axios = require("axios");
const fs = require("fs");
const { scheduleNextRun } = require("./schedule");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");
const UserAgentManager = require("./userAgentManager");
const userAgentManager = new UserAgentManager();

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

class BaboonGameBot {
    constructor() {
        this.config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
        this.tgInitDataList = fs.readFileSync("data.txt", "utf8").split("\n").filter(Boolean);
        this.proxyList = fs.readFileSync("proxy.txt", "utf8").split("\n").filter(Boolean);
        this.baseUrl = "https://baboon-telegram.onrender.com";
    }

    createAxiosInstance(queryId, userAgent = null) {
        const proxyIndex = this.tgInitDataList.findIndex((data) => data.includes(queryId));
        const proxy = this.proxyList[proxyIndex];

        const config = {
            headers: {
                "Content-Type": "application/json",
            },
        };

        if (userAgent) {
            config.headers["User-Agent"] = userAgent;
        }

        if (proxy) {
            if (proxy.startsWith("socks4://") || proxy.startsWith("socks5://")) {
                config.httpsAgent = new SocksProxyAgent(proxy);
            } else {
                config.httpsAgent = new HttpsProxyAgent(proxy);
            }
            console.log(`${colors.cyan}Using proxy: ${proxy}${colors.reset}`);
        }

        return axios.create(config);
    }

    async processUser(tgInitData, userAgent) {
        const axiosInstance = this.createAxiosInstance(tgInitData, userAgent);
        const now = new Date();
        const utcDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

        try {
            console.log(`${colors.blue}Getting user info...${colors.reset}`);
            const userResponse = await axiosInstance.get(`${this.baseUrl}/user?tgInitData=${tgInitData}`);
            console.log(`${colors.green}User info received${colors.reset}`);
            const dailyUser = userResponse?.data.user.hiGame.dailyUser;
            const questList = userResponse?.data.quests;
            const maxCapacity = userResponse?.data.user.hiGame.battery.maxCapacity;

            await this.dailyReward(dailyUser, axiosInstance, tgInitData, utcDate);

            if (this.config.processDailyCombo) {
                await this.dailyCombo(dailyUser, axiosInstance, tgInitData, utcDate);
            }

            if (this.config.processBatteryTaps) {
                await this.processBatteryTaps(maxCapacity, tgInitData, axiosInstance);
            }

            if (this.config.processBatteryTaps) {
                await this.processQuests(questList, tgInitData, axiosInstance);
            }

            console.log(
                `${colors.magenta}User session ${userResponse?.data.user.info.nickname} processed ${colors.reset}`
            );
        } catch (error) {
            console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
        }
    }

    async dailyReward(dailyUser, axiosInstance, tgInitData, utcDate) {
        console.log(`${colors.blue}Claiming daily login reward...${colors.reset}`);
        if (dailyUser && dailyUser.lastDLRDay != utcDate) {
            const loginReward = await axiosInstance.post(
                `${this.baseUrl}/game/claimDailyLoginReward?tgInitData=${tgInitData}`
            );
            console.log(`${colors.green}Daily login reward claimed${colors.reset}`);
        } else {
            console.log(`${colors.yellow}Daily login reward already claimed${colors.reset}`);
        }
    }

    async dailyCombo(dailyUser, axiosInstance, tgInitData, utcDate) {
        console.log(`${colors.blue}Claiming daily combo reward...${colors.reset}`);
        if (dailyUser && dailyUser.lastDCRDay != utcDate) {
            const comboReward = await axiosInstance.post(
                `${this.baseUrl}/game/claimDailyComboReward?tgInitData=${tgInitData}`,
                this.config.combo
            );
            console.log(
                `${colors.green}Daily combo reward claimed: ${comboReward.data.rewardAmount} tokens${colors.reset}`
            );
        } else {
            console.log(`${colors.yellow}Daily combo reward already claimed${colors.reset}`);
        }
    }

    async processBatteryTaps(maxCapacity, tgInitData, axiosInstance) {
        // Play the game - charge battery
        // console.log(`${colors.blue}Charging battery with ${tapsNumber} taps...${colors.reset}`);
        // await axiosInstance.post(`${this.baseUrl}/game/chargeBattery?tgInitData=${tgInitData}`, {
        //     tapsNumber: 135,
        // });
        // console.log(`${colors.green}Battery charged${colors.reset}`);

        // Process battery taps
        console.log(`${colors.blue}Processing battery taps...${colors.reset}`);
        await axiosInstance.post(`${this.baseUrl}/game/batteryTaps?tgInitData=${tgInitData}`, {
            tapsNumber: maxCapacity,
        });
        await this.sleep(this.getRandomNumber(1000, 5000));
        console.log(`${colors.green}Battery taps processed${colors.reset}`);
    }

    async processQuests(questList, tgInitData, axiosInstance) {
        console.log(`${colors.blue}Processing quests...${colors.reset}`);
        const questsToDo = questList
            .filter((quest) => quest.state === "InProgress")
            .map((quest) => ({
                id: quest.id,
                title: quest.title,
                description: quest.description,
                inviteLink: quest.inviteLink,
                isOutsideLink: quest.isOutsideLink,
                price: quest.price,
                miningSpeedPercent: quest.miningSpeedPercent,
            }));

        for (const quest of questsToDo) {
            console.log(`${colors.blue}Validating quest ${quest.title}...${colors.reset}`);

            const questValidation = await axiosInstance.post(
                `${this.baseUrl}/quests/validate?tgInitData=${tgInitData}`,
                { questId: quest.id }
            );

            await this.sleep(this.getRandomNumber(1000, 5000));

            if (questValidation.data === true) {
                console.log(`${colors.blue}Claiming quest reward ${quest.title}...${colors.reset}`);

                const questClaim = await axiosInstance.post(`${this.baseUrl}/quests/claim?tgInitData=${tgInitData}`, {
                    questId: quest.id,
                });

                await this.sleep(this.getRandomNumber(1000, 5000));

                if (questClaim.data === true) {
                    console.log(`${colors.green}Quest reward claimed${colors.reset}`);
                } else {
                    console.log(`${colors.yellow}Quest reward not claimed${colors.reset}`);
                }
            }
        }
    }

    async start() {
        console.log(`${colors.magenta}Starting Baboon Game Bot${colors.reset}`);

        for (const tgInitData of this.tgInitDataList) {
            console.log(`${colors.yellow}Processing new user session${colors.reset}`);
            const encodedTgInitData = encodeURIComponent(tgInitData);
            const userAgent = userAgentManager.getUserAgent(tgInitData);
            await this.processUser(encodedTgInitData, userAgent);

            await this.sleep(2000);
        }

        console.log(`${colors.magenta}Bot finished running${colors.reset}`);
        scheduleNextRun(12, () => this.start());
    }

    encodeUrlParams(params) {
        const keyValuePairs = params.split("&");
        const encodedPairs = keyValuePairs.map((pair) => {
            const [key, value] = pair.split("=");
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        });

        return encodedPairs.join("&");
    }

    async sleep(ms) {
        new Promise((resolve) => setTimeout(resolve, ms));
    }

    getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

const bot = new BaboonGameBot();
bot.start();
