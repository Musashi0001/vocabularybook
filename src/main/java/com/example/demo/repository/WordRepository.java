package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Word;

public interface WordRepository extends JpaRepository<Word, Long> {
}

