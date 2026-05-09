package com.example.cityticket.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cityticket.entity.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

	List<Transaction> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}
