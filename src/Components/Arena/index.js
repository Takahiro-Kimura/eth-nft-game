import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import LoadingIndicator from "../LoadingIndicator";
import { CONTRACT_ADDRESS, transformCharacterData } from "../../constants";
import myEpicGame from "../../utils/MyEpicGame.json";
import "./Arena.css";

const Arena = ({ characterNFT, setCharacterNFT }) => {
	const [gameContract, setGameContract] = useState(null);
	const [boss, setBoss] = useState(null);
	const [attackState, setAttackState] = useState("");
	const [showToast, setShowToast] = useState(false);

	const runAttackAction = async () => {
		try {
			if (gameContract) {
				setAttackState("attacking");
				console.log("Attacking boss...");

				const attackTxn = await gameContract.attackBoss();

				await attackTxn.wait();
				console.log("attackTxn:", attackTxn);

				setAttackState("hit");

				setShowToast(true);
				setTimeout(() => {
					setShowToast(false);
				}, 5000);
			} 
		}	catch (error) {
			console.error("Error attacking boss:", error);
			setAttackState("");
		}
	}

	useEffect(() => {
		// コントラクトからボスのメタデータを取得し、bossを設定する非同期関数 fetchBoss を設定します。
		const fetchBoss = async () => {
			const bossTxn = await gameContract.getBigBoss();
			console.log("Boss:", bossTxn);
			setBoss(transformCharacterData(bossTxn));
		};

		const onAttackComplete = (newBossHp, newPlayerHp) => {
			const bossHp = newBossHp.toNumber();
			const playerHp = newPlayerHp.toNumber();
			console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

			setBoss((prevState) => {
				return { ...prevState, hp: bossHp};
			});
			setCharacterNFT((prevState) => {
				return { ...prevState, hp: playerHp };
			});
		};
		if (gameContract) {
			// コントラクトの準備ができたら、ボスのメタデータを取得します。
			fetchBoss();
			gameContract.on("AttackComplete", onAttackComplete);
		}

		return () => {
			if (gameContract) {
				gameContract.off("AttackComplete", onAttackComplete)
			}
		}
	}, [gameContract]);

	useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );
      setGameContract(gameContract);
    } else {
      console.log("Ethereum object not found");
    }
  }, []);
	return (
		<div className="arena-container">
			{/* 攻撃ダメージの通知を追加します */}
			{boss && characterNFT && (
				<div id="toast" className={showToast ? "show" : ""}>
					<div id="desc">{`💥 ${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
				</div>
			)}
			{/* ボスをレンダリングします */}
			{boss && (
				<div className="boss-container">
					{/* attackState 追加します */}
					<div className={`boss-content ${attackState}`}>
						<h2>🔥 {boss.name} 🔥</h2>
						<div className="image-content">
							<img src={boss.imageURI} alt={`Boss ${boss.name}`} />
							<div className="health-bar">
								<progress value={boss.hp} max={boss.maxHp} />
								<p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
							</div>
						</div>
					</div>
					<div className="attack-container">
						<button className="cta-button" onClick={runAttackAction}>
							{`💥 Attack ${boss.name}`}
						</button>
					</div>
					{attackState === "attacking" && (
						<div className="loading-indicator">
							<LoadingIndicator />
							<p>Attacking ⚔️</p>
						</div>
					)}
				</div>
			)}
			{/* NFT キャラクター をレンダリングします*/}
			{characterNFT && (
				<div className="players-container">
					<div className="player-container">
						<h2>Your Character</h2>
						<div className="player">
							<div className="image-content">
								<h2>{characterNFT.name}</h2>
								<img
									src={`https://cloudflare-ipfs.com/ipfs/${characterNFT.imageURI}`}
									alt={`Character ${characterNFT.name}`}
								/>
								<div className="health-bar">
									<progress value={characterNFT.hp} max={characterNFT.maxHp} />
									<p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
								</div>
							</div>
							<div className="stats">
								<h4>{`⚔️ Attack Damage: ${characterNFT.attackDamage}`}</h4>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
export default Arena;