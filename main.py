import argparse
from web3 import Web3
from eth_account import Account


def gennerate_account():
    account = Account.create()
    private_key = account.key.hex()
    address = account.address
    return private_key, address


def main():
    number_of_account = argparse.ArgumentParser()
    # -n too
    number_of_account.add_argument(
        "-n",
        "--number_of_account",
        type=int,
        help="Number of account to generate",
        default=1,
    )

    args = number_of_account.parse_args()
    addreses = []
    for i in range(args.number_of_account):
        private_key, address = gennerate_account()
        print(f"Private key: {private_key}")
        print(f"Address: {address}")
        addreses.append({"private_key": private_key, "address": address})

    # save to file csv
    with open("account.csv", "w") as f:
        f.write("Private key, Address\n")
        for account in addreses:
            f.write(f'{account["private_key"]}, {account["address"]}\n')


if __name__ == "__main__":
    main()
