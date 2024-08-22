# Steam Inventory and Trading Bot

## Overview

This project is a web application that integrates with the Steam API to manage and trade virtual items. Users can view their inventory, withdraw and deposit items, and manage their balances through the Razorpay payment gateway. The application uses Passport.js for authentication and Express.js as the web framework.

## Features

- **User Authentication**: Users can log in using their Steam account.
- **Inventory Management**: View and sort your inventory based on item prices.
- **Trade Items**: Withdraw and deposit items to and from your inventory.
- **Payment Integration**: Add balance to your account via Razorpay.
- **Session Management**: User sessions are handled securely.

## Technologies Used

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for Node.js.
- **Passport.js**: Authentication middleware for Node.js.
- **Steam API**: For Steam authentication and trading.
- **Razorpay**: Payment gateway for handling transactions.
- **PostgreSQL**: Relational database for storing user data.
- **Axios**: HTTP client for fetching item prices.
- **EJS**: Templating engine for rendering views.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- A Steam account and API key
- A Razorpay account and API keys

### Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-repo/steam-inventory-bot.git
   cd steam-inventory-bot

2. **Install Dependencies:**

    ```bash
   npm install

3. **Create and Configure .env File:**

    Configure the .env file in the root directory of the project with the following content:

    ```dotenv
    PORT=3000

    # Steam Configuration
    STEAM_API_KEY=your_steam_api_key
    STEAM_ACCOUNT_NAME=your_steam_account_name
    STEAM_PASSWORD=your_steam_password
    STEAM_SHARED_SECRET=your_steam_shared_secret
    STEAM_RETURN_URL=http://localhost:3000
    STEAM_REALM=http://localhost:3000/

    # Razorpay Configuration
    RAZORPAY_KEY_ID=your_razorpay_key_id
    RAZORPAY_KEY_SECRET=your_razorpay_key_secret

    # Database Configuration
    DATABASE_USER=your_database_user
    DATABASE_HOST=your_database_host
    DATABASE_NAME=your_database_name
    DATABASE_PASSWORD=your_database_password
    DATABASE_PORT=your_database_port

    # Session Secret
    SESSION_SECRET=your_session_secret

4. **Database Setup:**
    - **s_id**: User's Steam ID (TEXT), used as the primary key.
    - **name**: User's display name (TEXT), cannot be null.
    - **pfp**: User's profile picture URL (TEXT), cannot be null.
    - **balance**: User's account balance (INT8), with a default value of 0.

    ```sql
    CREATE TABLE users (
    s_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pfp TEXT NOT NULL,
    balance INT8 DEFAULT 0
    );


5. **Run the application**

    ```bash
    npm start

## Usage

-    **Login:** Navigate to /login to authenticate with Steam.
-    **View Inventory:** Access the home page to view and manage your inventory.
-    **Withdraw Items:** Use /withdraw?assetid=ITEM_ID to withdraw an item.
-    **Deposit Items:** Use /deposit?assetid=ITEM_ID to deposit an item.
-    **Add Balance:** Go to /addbalance to add funds to your account.
-    **Checkout:** Visit /checkout?amount=AMOUNT to initiate a payment.

