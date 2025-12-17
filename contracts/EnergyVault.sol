// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EnergyVault - A private energy data management contract
/// @author Power Key Vault Team
/// @notice Store and manage encrypted energy generation/consumption records
/// @dev Uses FHEVM for fully homomorphic encryption of energy data
contract EnergyVault is SepoliaConfig {
    /// @notice Enum for energy record types
    enum RecordType {
        GENERATION,
        CONSUMPTION
    }

    /// @notice Structure for an encrypted energy record
    struct EnergyRecord {
        uint256 id;
        RecordType recordType;
        string source;
        euint32 encryptedValue;
        uint256 timestamp;
        address owner;
    }

    /// @notice Counter for record IDs
    uint256 private _nextRecordId;

    /// @notice Mapping from record ID to EnergyRecord
    mapping(uint256 => EnergyRecord) private _records;

    /// @notice Mapping from user address to their record IDs
    mapping(address => uint256[]) private _userRecords;

    /// @notice Encrypted aggregated generation total per user
    mapping(address => euint32) private _totalGeneration;

    /// @notice Encrypted aggregated consumption total per user
    mapping(address => euint32) private _totalConsumption;

    /// @notice Track if user has initialized their totals
    mapping(address => bool) private _generationInitialized;
    mapping(address => bool) private _consumptionInitialized;

    /// @notice Event emitted when a new energy record is created
    event RecordCreated(
        uint256 indexed id,
        address indexed owner,
        RecordType recordType,
        string source,
        uint256 timestamp
    );

    /// @notice Event emitted when a record is decrypted (for logging purposes)
    event RecordDecrypted(
        uint256 indexed id,
        address indexed requestor
    );

    /// @notice Get the total number of records
    /// @return The total count of records created
    function getTotalRecords() external view returns (uint256) {
        return _nextRecordId;
    }

    /// @notice Get record IDs for a specific user
    /// @param user The address of the user
    /// @return Array of record IDs owned by the user
    function getUserRecordIds(address user) external view returns (uint256[] memory) {
        return _userRecords[user];
    }

    /// @notice Get metadata for a specific record (excluding encrypted value)
    /// @param recordId The ID of the record
    /// @return id The record ID
    /// @return recordType The type of record (generation or consumption)
    /// @return source The source description
    /// @return timestamp The creation timestamp
    /// @return owner The record owner address
    function getRecordMetadata(uint256 recordId) external view returns (
        uint256 id,
        RecordType recordType,
        string memory source,
        uint256 timestamp,
        address owner
    ) {
        EnergyRecord storage record = _records[recordId];
        require(record.owner != address(0), "Record does not exist");
        return (record.id, record.recordType, record.source, record.timestamp, record.owner);
    }

    /// @notice Get the encrypted value of a record (only accessible by owner)
    /// @param recordId The ID of the record
    /// @return The encrypted energy value
    function getRecordEncryptedValue(uint256 recordId) external view returns (euint32) {
        EnergyRecord storage record = _records[recordId];
        require(record.owner != address(0), "Record does not exist");
        require(record.owner == msg.sender, "Not record owner");
        return record.encryptedValue;
    }

    /// @notice Get encrypted total generation for a user
    /// @param user The address of the user
    /// @return The encrypted total generation value
    function getTotalGeneration(address user) external view returns (euint32) {
        require(user == msg.sender, "Can only view own totals");
        return _totalGeneration[user];
    }

    /// @notice Get encrypted total consumption for a user
    /// @param user The address of the user
    /// @return The encrypted total consumption value
    function getTotalConsumption(address user) external view returns (euint32) {
        require(user == msg.sender, "Can only view own totals");
        return _totalConsumption[user];
    }

    /// @notice Create a new energy generation record
    /// @param source The source description (e.g., "Solar Panel")
    /// @param encryptedValue The encrypted energy value
    /// @param inputProof The input proof for the encrypted value
    /// @return recordId The ID of the newly created record
    function createGenerationRecord(
        string calldata source,
        externalEuint32 encryptedValue,
        bytes calldata inputProof
    ) external returns (uint256 recordId) {
        euint32 value = FHE.fromExternal(encryptedValue, inputProof);
        recordId = _createRecord(RecordType.GENERATION, source, value);
        
        // Update total generation
        if (!_generationInitialized[msg.sender]) {
            _totalGeneration[msg.sender] = value;
            _generationInitialized[msg.sender] = true;
        } else {
            _totalGeneration[msg.sender] = FHE.add(_totalGeneration[msg.sender], value);
        }
        FHE.allowThis(_totalGeneration[msg.sender]);
        FHE.allow(_totalGeneration[msg.sender], msg.sender);
    }

    /// @notice Create a new energy consumption record
    /// @param source The source description (e.g., "Home Usage")
    /// @param encryptedValue The encrypted energy value
    /// @param inputProof The input proof for the encrypted value
    /// @return recordId The ID of the newly created record
    function createConsumptionRecord(
        string calldata source,
        externalEuint32 encryptedValue,
        bytes calldata inputProof
    ) external returns (uint256 recordId) {
        euint32 value = FHE.fromExternal(encryptedValue, inputProof);
        recordId = _createRecord(RecordType.CONSUMPTION, source, value);
        
        // Update total consumption
        if (!_consumptionInitialized[msg.sender]) {
            _totalConsumption[msg.sender] = value;
            _consumptionInitialized[msg.sender] = true;
        } else {
            _totalConsumption[msg.sender] = FHE.add(_totalConsumption[msg.sender], value);
        }
        FHE.allowThis(_totalConsumption[msg.sender]);
        FHE.allow(_totalConsumption[msg.sender], msg.sender);
    }

    /// @notice Internal function to create a record
    /// @param recordType The type of record
    /// @param source The source description
    /// @param value The encrypted value
    /// @return recordId The ID of the created record
    function _createRecord(
        RecordType recordType,
        string calldata source,
        euint32 value
    ) internal returns (uint256 recordId) {
        recordId = _nextRecordId++;
        
        _records[recordId] = EnergyRecord({
            id: recordId,
            recordType: recordType,
            source: source,
            encryptedValue: value,
            timestamp: block.timestamp,
            owner: msg.sender
        });
        
        _userRecords[msg.sender].push(recordId);
        
        // Allow contract and owner to access encrypted value
        FHE.allowThis(value);
        FHE.allow(value, msg.sender);
        
        emit RecordCreated(recordId, msg.sender, recordType, source, block.timestamp);
    }

    /// @notice Get the count of records for a user
    /// @param user The address of the user
    /// @return The number of records owned by the user
    function getUserRecordCount(address user) external view returns (uint256) {
        return _userRecords[user].length;
    }

    /// @notice Check if an address is the owner of a record
    /// @param recordId The ID of the record
    /// @param user The address to check
    /// @return True if the user owns the record
    function isRecordOwner(uint256 recordId, address user) external view returns (bool) {
        return _records[recordId].owner == user;
    }
}
