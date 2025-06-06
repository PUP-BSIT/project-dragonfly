const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";

class TransferService {
    static async fetchBalance() {
        try {
            const response = await fetch(API_BASE + '/api/account/balance.php');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching balance:', error);
            throw error;
        }
    }

    static async initiateTransfer(transferData) {
        try {
            const response = await fetch(API_BASE + '/api/transfer/internal.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(transferData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error initiating transfer:', error);
            throw error;
        }
    }

    static async verifyOtp(transferData) {
        try {
            const response = await fetch('/api/transfer/internal.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(transferData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error verifying OTP:', error);
            throw error;
        }
    }
} 