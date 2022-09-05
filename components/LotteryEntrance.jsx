import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { abi, contractAddresses } from "../constants";
import { ethers } from "ethers";
import { useNotification } from "@web3uikit/core";

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled, web3 } = useMoralis();
    const chainId = parseInt(chainIdHex);
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null;
    const [entranceFee, setEntraceFee] = useState("0");
    const [recentWinner, setRecentWinner] = useState("0");
    const [numberOfPlayers, setNumberOfPlayers] = useState("0");

    const dispatch = useNotification();

    const {
        runContractFunction: enterRaffle,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    });

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
        params: {},
    });
    //getNumberOfPlayers

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    });

    //getRecentWinner
    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},
    });
    async function updateUI() {
        const entranceFeeFromCall = (await getEntranceFee()).toString();
        const numPlayersFromCall = (await getNumberOfPlayers()).toString();
        const RecentWinnerFromCall = await getRecentWinner();
        setEntraceFee(entranceFeeFromCall);
        setNumberOfPlayers(numPlayersFromCall);
        setRecentWinner(RecentWinnerFromCall);
    }
    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI();
            //listen for WinnerPicked event
        }
    }, [isWeb3Enabled]);
    async function listenForWinnerToBePicked() {
        const lottery = new ethers.Contract(raffleAddress, abi, web3);
        console.log("Waiting for a winner ...");
        await new Promise((resolve, reject) => {
            lottery.once("WinnerPicked", async () => {
                console.log("We got a winner!");
                try {
                    await updateUI();
                    resolve();
                } catch (error) {
                    console.log(error);
                    reject(error);
                }
            });
        });
    }
    const handleSuccess = async (tx) => {
        await tx.wait(1); //wait one block
        handleNewNotification(tx);
        //Update ui on new notification
        updateUI();
    };

    //handle web3uikit notification
    const handleNewNotification = () => {
        dispatch({
            type: "info",
            message: "transaction Complete!",
            title: "Tx Notification",
            position: "topR",
        });
    };

    return (
        <div className="p-5">
            Hi from Lottery Entrance!
            {raffleAddress ? (
                <div className="">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font=bold py-2 px-4 rounded ml-auto"
                        onClick={async () => {
                            await enterRaffle({
                                onSuccess: handleSuccess, //checks to see if a transcation is successfully sent to metamask
                                onError: (error) => console.log(error), //always run when calling contract functins to see if they break
                            });
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter Lottery</div>
                        )}
                    </button>
                    <div>Entrance Fee: {ethers.utils.formatUnits(entranceFee, "ether")} ETH </div>
                    <div>Number Of Players: {numberOfPlayers}</div>
                    <div>Recent Winner: {recentWinner}</div>
                </div>
            ) : (
                <div>No Raffle Address Detected</div>
            )}
        </div>
    );
}
