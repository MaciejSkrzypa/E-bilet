package com.example.cityticket.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cityticket.entity.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

	Page<Transaction> findAllByUserId(Long userId, Pageable pageable);
}
