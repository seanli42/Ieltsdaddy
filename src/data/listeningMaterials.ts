export interface ListeningMaterial {
  id: string;
  title: string;
  book: string;
  test: string;
  part: string;
  audioUrl: string;
  lrcUrl: string;
  duration: string;
}

export const listeningMaterials: ListeningMaterial[] = [
  // Cambridge 14
  { id: 'c14-t1-p1', title: 'Test 1 - Part 1: Police Report', book: 'Cambridge 14', test: 'Test 1', part: 'Part 1', audioUrl: '/audio/listening/Cambridge14_Test1_Section01.mp3', lrcUrl: '/audio/listening/Cambridge14_Test1_Section01.mp3.lrc', duration: '10:00' },
  { id: 'c14-t1-p2', title: 'Test 1 - Part 2: Museum Guide', book: 'Cambridge 14', test: 'Test 1', part: 'Part 2', audioUrl: '/audio/listening/Cambridge14_Test1_Section02.mp3', lrcUrl: '/audio/listening/Cambridge14_Test1_Section02.mp3.lrc', duration: '10:00' },
  { id: 'c14-t1-p3', title: 'Test 1 - Part 3: Course Discussion', book: 'Cambridge 14', test: 'Test 1', part: 'Part 3', audioUrl: '/audio/listening/Cambridge14_Test1_Section03.mp3', lrcUrl: '/audio/listening/Cambridge14_Test1_Section03.mp3.lrc', duration: '10:00' },
  { id: 'c14-t1-p4', title: 'Test 1 - Part 4: Marine Biology', book: 'Cambridge 14', test: 'Test 1', part: 'Part 4', audioUrl: '/audio/listening/Cambridge14_Test1_Section04.mp3', lrcUrl: '/audio/listening/Cambridge14_Test1_Section04.mp3.lrc', duration: '10:00' },
  { id: 'c14-t2-p1', title: 'Test 2 - Part 1: Transport Survey', book: 'Cambridge 14', test: 'Test 2', part: 'Part 1', audioUrl: '/audio/listening/Cambridge14_Test2_Section05.mp3', lrcUrl: '/audio/listening/Cambridge14_Test2_Section05.mp3.lrc', duration: '10:00' },
  { id: 'c14-t2-p2', title: 'Test 2 - Part 2: Festival Information', book: 'Cambridge 14', test: 'Test 2', part: 'Part 2', audioUrl: '/audio/listening/Cambridge14_Test2_Section06.mp3', lrcUrl: '/audio/listening/Cambridge14_Test2_Section06.mp3.lrc', duration: '10:00' },
  { id: 'c14-t2-p3', title: 'Test 2 - Part 3: Work Placement', book: 'Cambridge 14', test: 'Test 2', part: 'Part 3', audioUrl: '/audio/listening/Cambridge14_Test2_Section07.mp3', lrcUrl: '/audio/listening/Cambridge14_Test2_Section07.mp3.lrc', duration: '10:00' },
  { id: 'c14-t2-p4', title: 'Test 2 - Part 4: Psychology Lecture', book: 'Cambridge 14', test: 'Test 2', part: 'Part 4', audioUrl: '/audio/listening/Cambridge14_Test2_Section08.mp3', lrcUrl: '/audio/listening/Cambridge14_Test2_Section08.mp3.lrc', duration: '10:00' },
  { id: 'c14-t3-p1', title: 'Test 3 - Part 1: Job Enquiry', book: 'Cambridge 14', test: 'Test 3', part: 'Part 1', audioUrl: '/audio/listening/Cambridge14_Test3_Section09.mp3', lrcUrl: '/audio/listening/Cambridge14_Test3_Section09.mp3.lrc', duration: '10:00' },
  { id: 'c14-t3-p2', title: 'Test 3 - Part 2: Park Tour', book: 'Cambridge 14', test: 'Test 3', part: 'Part 2', audioUrl: '/audio/listening/Cambridge14_Test3_Section10.mp3', lrcUrl: '/audio/listening/Cambridge14_Test3_Section10.mp3.lrc', duration: '10:00' },
  { id: 'c14-t3-p3', title: 'Test 3 - Part 3: Study Skills', book: 'Cambridge 14', test: 'Test 3', part: 'Part 3', audioUrl: '/audio/listening/Cambridge14_Test3_Section11.mp3', lrcUrl: '/audio/listening/Cambridge14_Test3_Section11.mp3.lrc', duration: '10:00' },
  { id: 'c14-t3-p4', title: 'Test 3 - Part 4: Architecture', book: 'Cambridge 14', test: 'Test 3', part: 'Part 4', audioUrl: '/audio/listening/Cambridge14_Test3_Section12.mp3', lrcUrl: '/audio/listening/Cambridge14_Test3_Section12.mp3.lrc', duration: '10:00' },
  { id: 'c14-t4-p1', title: 'Test 4 - Part 1: Holiday Rental', book: 'Cambridge 14', test: 'Test 4', part: 'Part 1', audioUrl: '/audio/listening/Cambridge14_Test4_Section13.mp3', lrcUrl: '/audio/listening/Cambridge14_Test4_Section13.mp3.lrc', duration: '10:00' },
  { id: 'c14-t4-p2', title: 'Test 4 - Part 2: Sports Centre', book: 'Cambridge 14', test: 'Test 4', part: 'Part 2', audioUrl: '/audio/listening/Cambridge14_Test4_Section14.mp3', lrcUrl: '/audio/listening/Cambridge14_Test4_Section14.mp3.lrc', duration: '10:00' },
  { id: 'c14-t4-p3', title: 'Test 4 - Part 3: Presentation', book: 'Cambridge 14', test: 'Test 4', part: 'Part 3', audioUrl: '/audio/listening/Cambridge14_Test4_Section15.mp3', lrcUrl: '/audio/listening/Cambridge14_Test4_Section15.mp3.lrc', duration: '10:00' },
  { id: 'c14-t4-p4', title: 'Test 4 - Part 4: Climate Change', book: 'Cambridge 14', test: 'Test 4', part: 'Part 4', audioUrl: '/audio/listening/Cambridge14_Test4_Section16.mp3', lrcUrl: '/audio/listening/Cambridge14_Test4_Section16.mp3.lrc', duration: '10:00' },
  
  // Cambridge 15
  { id: 'c15-t1-p1', title: 'Test 1 - Part 1: Job Agency', book: 'Cambridge 15', test: 'Test 1', part: 'Part 1', audioUrl: '/audio/listening/IELTS15_test1_audio1.mp3', lrcUrl: '/audio/listening/IELTS15_test1_audio1.mp3.lrc', duration: '10:00' },
  { id: 'c15-t1-p2', title: 'Test 1 - Part 2: Water Park', book: 'Cambridge 15', test: 'Test 1', part: 'Part 2', audioUrl: '/audio/listening/IELTS15_test1_audio2.mp3', lrcUrl: '/audio/listening/IELTS15_test1_audio2.mp3.lrc', duration: '10:00' },
  { id: 'c15-t1-p3', title: 'Test 1 - Part 3: Project Discussion', book: 'Cambridge 15', test: 'Test 1', part: 'Part 3', audioUrl: '/audio/listening/IELTS15_test1_audio3.mp3', lrcUrl: '/audio/listening/IELTS15_test1_audio3.mp3.lrc', duration: '10:00' },
  { id: 'c15-t1-p4', title: 'Test 1 - Part 4: Agriculture', book: 'Cambridge 15', test: 'Test 1', part: 'Part 4', audioUrl: '/audio/listening/IELTS15_test1_audio4.mp3', lrcUrl: '/audio/listening/IELTS15_test1_audio4.mp3.lrc', duration: '10:00' },
  { id: 'c15-t2-p1', title: 'Test 2 - Part 1: Travel Insurance', book: 'Cambridge 15', test: 'Test 2', part: 'Part 1', audioUrl: '/audio/listening/IELTS15_test2_audio1.mp3', lrcUrl: '/audio/listening/IELTS15_test2_audio1.mp3.lrc', duration: '10:00' },
  { id: 'c15-t2-p2', title: 'Test 2 - Part 2: Theatre Trip', book: 'Cambridge 15', test: 'Test 2', part: 'Part 2', audioUrl: '/audio/listening/IELTS15_test2_audio2.mp3', lrcUrl: '/audio/listening/IELTS15_test2_audio2.mp3.lrc', duration: '10:00' },
  { id: 'c15-t2-p3', title: 'Test 2 - Part 3: Course Feedback', book: 'Cambridge 15', test: 'Test 2', part: 'Part 3', audioUrl: '/audio/listening/IELTS15_test2_audio3.mp3', lrcUrl: '/audio/listening/IELTS15_test2_audio3.mp3.lrc', duration: '10:00' },
  { id: 'c15-t2-p4', title: 'Test 2 - Part 4: Urban Planning', book: 'Cambridge 15', test: 'Test 2', part: 'Part 4', audioUrl: '/audio/listening/IELTS15_test2_audio4.mp3', lrcUrl: '/audio/listening/IELTS15_test2_audio4.mp3.lrc', duration: '10:00' },
  { id: 'c15-t3-p1', title: 'Test 3 - Part 1: Car Rental', book: 'Cambridge 15', test: 'Test 3', part: 'Part 1', audioUrl: '/audio/listening/IELTS15_test3_audio1.mp3', lrcUrl: '/audio/listening/IELTS15_test3_audio1.mp3.lrc', duration: '10:00' },
  { id: 'c15-t3-p2', title: 'Test 3 - Part 2: Art Gallery', book: 'Cambridge 15', test: 'Test 3', part: 'Part 2', audioUrl: '/audio/listening/IELTS15_test3_audio2.mp3', lrcUrl: '/audio/listening/IELTS15_test3_audio2.mp3.lrc', duration: '10:00' },
  { id: 'c15-t3-p3', title: 'Test 3 - Part 3: Research Methods', book: 'Cambridge 15', test: 'Test 3', part: 'Part 3', audioUrl: '/audio/listening/IELTS15_test3_audio3.mp3', lrcUrl: '/audio/listening/IELTS15_test3_audio3.mp3.lrc', duration: '10:00' },
  { id: 'c15-t3-p4', title: 'Test 3 - Part 4: Sleep Research', book: 'Cambridge 15', test: 'Test 3', part: 'Part 4', audioUrl: '/audio/listening/IELTS15_test3_audio4.mp3', lrcUrl: '/audio/listening/IELTS15_test3_audio4.mp3.lrc', duration: '10:00' },
  { id: 'c15-t4-p1', title: 'Test 4 - Part 1: Hotel Booking', book: 'Cambridge 15', test: 'Test 4', part: 'Part 1', audioUrl: '/audio/listening/IELTS15_test4_audio1.mp3', lrcUrl: '/audio/listening/IELTS15_test4_audio1.mp3.lrc', duration: '10:00' },
  { id: 'c15-t4-p2', title: 'Test 4 - Part 2: Walking Tour', book: 'Cambridge 15', test: 'Test 4', part: 'Part 2', audioUrl: '/audio/listening/IELTS15_test4_audio2.mp3', lrcUrl: '/audio/listening/IELTS15_test4_audio2.mp3.lrc', duration: '10:00' },
  { id: 'c15-t4-p3', title: 'Test 4 - Part 3: Internship', book: 'Cambridge 15', test: 'Test 4', part: 'Part 3', audioUrl: '/audio/listening/IELTS15_test4_audio3.mp3', lrcUrl: '/audio/listening/IELTS15_test4_audio3.mp3.lrc', duration: '10:00' },
  { id: 'c15-t4-p4', title: 'Test 4 - Part 4: Extinction', book: 'Cambridge 15', test: 'Test 4', part: 'Part 4', audioUrl: '/audio/listening/IELTS15_test4_audio4.mp3', lrcUrl: '/audio/listening/IELTS15_test4_audio4.mp3.lrc', duration: '10:00' },
  
  // Cambridge 16
  { id: 'c16-t1-p1', title: 'Test 1 - Part 1: Engineering Workshops', book: 'Cambridge 16', test: 'Test 1', part: 'Part 1', audioUrl: '/audio/listening/IELTS 16, Test 1, Part １.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 1, Part １.mp3.lrc', duration: '10:00' },
  { id: 'c16-t1-p2', title: 'Test 1 - Part 2: Walking Group', book: 'Cambridge 16', test: 'Test 1', part: 'Part 2', audioUrl: '/audio/listening/IELTS 16, Test 1, Part 2.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 1, Part 2.mp3.lrc', duration: '10:00' },
  { id: 'c16-t1-p3', title: 'Test 1 - Part 3: Assignment Discussion', book: 'Cambridge 16', test: 'Test 1', part: 'Part 3', audioUrl: '/audio/listening/IELTS 16, Test 1, Part 3.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 1, Part 3.mp3.lrc', duration: '10:00' },
  { id: 'c16-t1-p4', title: 'Test 1 - Part 4: Tea History', book: 'Cambridge 16', test: 'Test 1', part: 'Part 4', audioUrl: '/audio/listening/IELTS 16, Test 1, Part 4.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 1, Part 4.mp3.lrc', duration: '10:00' },
  { id: 'c16-t2-p1', title: 'Test 2 - Part 1: Party Arrangements', book: 'Cambridge 16', test: 'Test 2', part: 'Part 1', audioUrl: '/audio/listening/IELTS 16, Test 2, Part 1.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 2, Part 1.mp3.lrc', duration: '10:00' },
  { id: 'c16-t2-p2', title: 'Test 2 - Part 2: Airport Expansion', book: 'Cambridge 16', test: 'Test 2', part: 'Part 2', audioUrl: '/audio/listening/IELTS 16, Test 2, Part 2.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 2, Part 2.mp3.lrc', duration: '10:00' },
  { id: 'c16-t2-p3', title: 'Test 2 - Part 3: Music Practice', book: 'Cambridge 16', test: 'Test 2', part: 'Part 3', audioUrl: '/audio/listening/IELTS 16, Test 2, Part 3.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 2, Part 3.mp3.lrc', duration: '10:00' },
  { id: 'c16-t2-p4', title: 'Test 2 - Part 4: Communication', book: 'Cambridge 16', test: 'Test 2', part: 'Part 4', audioUrl: '/audio/listening/IELTS 16, Test 2, Part 4.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 2, Part 4.mp3.lrc', duration: '10:00' },
  { id: 'c16-t3-p1', title: 'Test 3 - Part 1: Library Registration', book: 'Cambridge 16', test: 'Test 3', part: 'Part 1', audioUrl: '/audio/listening/IELTS 16, Test 3, Part 1.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 3, Part 1.mp3.lrc', duration: '10:00' },
  { id: 'c16-t3-p2', title: 'Test 3 - Part 2: Trip to Europe', book: 'Cambridge 16', test: 'Test 3', part: 'Part 2', audioUrl: '/audio/listening/IELTS 16, Test 3, Part 2.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 3, Part 2.mp3.lrc', duration: '10:00' },
  { id: 'c16-t3-p3', title: 'Test 3 - Part 3: Dissertation', book: 'Cambridge 16', test: 'Test 3', part: 'Part 3', audioUrl: '/audio/listening/IELTS 16, Test 3, Part 3.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 3, Part 3.mp3.lrc', duration: '10:00' },
  { id: 'c16-t3-p4', title: 'Test 3 - Part 4: Maple Syrup', book: 'Cambridge 16', test: 'Test 3', part: 'Part 4', audioUrl: '/audio/listening/IELTS 16, Test 3, Part 4.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 3, Part 4.mp3.lrc', duration: '10:00' },
  { id: 'c16-t4-p1', title: 'Test 4 - Part 1: Holiday Apartment', book: 'Cambridge 16', test: 'Test 4', part: 'Part 1', audioUrl: '/audio/listening/IELTS 16, Test 4, Part 1.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 4, Part 1.mp3.lrc', duration: '10:00' },
  { id: 'c16-t4-p2', title: 'Test 4 - Part 2: New Library', book: 'Cambridge 16', test: 'Test 4', part: 'Part 2', audioUrl: '/audio/listening/IELTS 16, Test 4, Part 2.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 4, Part 2.mp3.lrc', duration: '10:00' },
  { id: 'c16-t4-p3', title: 'Test 4 - Part 3: Work Experience', book: 'Cambridge 16', test: 'Test 4', part: 'Part 3', audioUrl: '/audio/listening/IELTS 16, Test 4, Part 3.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 4, Part 3.mp3.lrc', duration: '10:00' },
  { id: 'c16-t4-p4', title: 'Test 4 - Part 4: Dolphins', book: 'Cambridge 16', test: 'Test 4', part: 'Part 4', audioUrl: '/audio/listening/IELTS 16, Test 4, Part 4.mp3', lrcUrl: '/audio/listening/IELTS 16, Test 4, Part 4.mp3.lrc', duration: '10:00' },
  
  // Cambridge 17
  { id: 'c17-t1-p1', title: 'Test 1 - Part 1: Moving Office', book: 'Cambridge 17', test: 'Test 1', part: 'Part 1', audioUrl: '/audio/listening/ELT_IELTS17_t1_audio1.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t1_audio1.mp3.lrc', duration: '10:00' },
  { id: 'c17-t1-p2', title: 'Test 1 - Part 2: Swimming Pool', book: 'Cambridge 17', test: 'Test 1', part: 'Part 2', audioUrl: '/audio/listening/ELT_IELTS17_t1_audio2.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t1_audio2.mp3.lrc', duration: '10:00' },
  { id: 'c17-t1-p3', title: 'Test 1 - Part 3: Field Trip', book: 'Cambridge 17', test: 'Test 1', part: 'Part 3', audioUrl: '/audio/listening/ELT_IELTS17_t1_audio3.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t1_audio3.mp3.lrc', duration: '10:00' },
  { id: 'c17-t1-p4', title: 'Test 1 - Part 4: Bird Migration', book: 'Cambridge 17', test: 'Test 1', part: 'Part 4', audioUrl: '/audio/listening/ELT_IELTS17_t1_audio4.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t1_audio4.mp3.lrc', duration: '10:00' },
  { id: 'c17-t2-p1', title: 'Test 2 - Part 1: Bike Tour', book: 'Cambridge 17', test: 'Test 2', part: 'Part 1', audioUrl: '/audio/listening/ELT_IELTS17_t2_audio1.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t2_audio1.mp3.lrc', duration: '10:00' },
  { id: 'c17-t2-p2', title: 'Test 2 - Part 2: Sports Centre', book: 'Cambridge 17', test: 'Test 2', part: 'Part 2', audioUrl: '/audio/listening/ELT_IELTS17_t2_audio2.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t2_audio2.mp3.lrc', duration: '10:00' },
  { id: 'c17-t2-p3', title: 'Test 2 - Part 3: Psychology Study', book: 'Cambridge 17', test: 'Test 2', part: 'Part 3', audioUrl: '/audio/listening/ELT_IELTS17_t2_audio3.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t2_audio3.mp3.lrc', duration: '10:00' },
  { id: 'c17-t2-p4', title: 'Test 2 - Part 4: Food Technology', book: 'Cambridge 17', test: 'Test 2', part: 'Part 4', audioUrl: '/audio/listening/ELT_IELTS17_t2_audio4.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t2_audio4.mp3.lrc', duration: '10:00' },
  { id: 'c17-t3-p1', title: 'Test 3 - Part 1: Photography Course', book: 'Cambridge 17', test: 'Test 3', part: 'Part 1', audioUrl: '/audio/listening/ELT_IELTS17_t3_audio1.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t3_audio1.mp3.lrc', duration: '10:00' },
  { id: 'c17-t3-p2', title: 'Test 3 - Part 2: Festival', book: 'Cambridge 17', test: 'Test 3', part: 'Part 2', audioUrl: '/audio/listening/ELT_IELTS17_t3_audio2.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t3_audio2.mp3.lrc', duration: '10:00' },
  { id: 'c17-t3-p3', title: 'Test 3 - Part 3: Presentation Skills', book: 'Cambridge 17', test: 'Test 3', part: 'Part 3', audioUrl: '/audio/listening/ELT_IELTS17_t3_audio3.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t3_audio3.mp3.lrc', duration: '10:00' },
  { id: 'c17-t3-p4', title: 'Test 3 - Part 4: Cave Art', book: 'Cambridge 17', test: 'Test 3', part: 'Part 4', audioUrl: '/audio/listening/ELT_IELTS17_t3_audio4.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t3_audio4.mp3.lrc', duration: '10:00' },
  { id: 'c17-t4-p1', title: 'Test 4 - Part 1: Charity Event', book: 'Cambridge 17', test: 'Test 4', part: 'Part 1', audioUrl: '/audio/listening/ELT_IELTS17_t4_audio1.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t4_audio1.mp3.lrc', duration: '10:00' },
  { id: 'c17-t4-p2', title: 'Test 4 - Part 2: Nature Reserve', book: 'Cambridge 17', test: 'Test 4', part: 'Part 2', audioUrl: '/audio/listening/ELT_IELTS17_t4_audio2.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t4_audio2.mp3.lrc', duration: '10:00' },
  { id: 'c17-t4-p3', title: 'Test 4 - Part 3: Job Interview', book: 'Cambridge 17', test: 'Test 4', part: 'Part 3', audioUrl: '/audio/listening/ELT_IELTS17_t4_audio3.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t4_audio3.mp3.lrc', duration: '10:00' },
  { id: 'c17-t4-p4', title: 'Test 4 - Part 4: Climate History', book: 'Cambridge 17', test: 'Test 4', part: 'Part 4', audioUrl: '/audio/listening/ELT_IELTS17_t4_audio4.mp3', lrcUrl: '/audio/listening/ELT_IELTS17_t4_audio4.mp3.lrc', duration: '10:00' },
  
  // Cambridge 18
  { id: 'c18-t1-p1', title: 'Test 1 - Part 1: Holiday Booking', book: 'Cambridge 18', test: 'Test 1', part: 'Part 1', audioUrl: '/audio/listening/Test 1 Part 1.mp3', lrcUrl: '/audio/listening/Test 1 Part 1.mp3.lrc', duration: '10:00' },
  { id: 'c18-t1-p2', title: 'Test 1 - Part 2: Restaurant', book: 'Cambridge 18', test: 'Test 1', part: 'Part 2', audioUrl: '/audio/listening/Test 1 Part 2.mp3', lrcUrl: '/audio/listening/Test 1 Part 2.mp3.lrc', duration: '10:00' },
  { id: 'c18-t1-p3', title: 'Test 1 - Part 3: Course Selection', book: 'Cambridge 18', test: 'Test 1', part: 'Part 3', audioUrl: '/audio/listening/Test 1 Part 3.mp3', lrcUrl: '/audio/listening/Test 1 Part 3.mp3.lrc', duration: '10:00' },
  { id: 'c18-t1-p4', title: 'Test 1 - Part 4: Materials Engineering', book: 'Cambridge 18', test: 'Test 1', part: 'Part 4', audioUrl: '/audio/listening/Test 1 Part 4.mp3', lrcUrl: '/audio/listening/Test 1 Part 4.mp3.lrc', duration: '10:00' },
  { id: 'c18-t2-p1', title: 'Test 2 - Part 1: Party Arrangements', book: 'Cambridge 18', test: 'Test 2', part: 'Part 1', audioUrl: '/audio/listening/Test 2 Part 1.mp3', lrcUrl: '/audio/listening/Test 2 Part 1.mp3.lrc', duration: '10:00' },
  { id: 'c18-t2-p2', title: 'Test 2 - Part 2: Museum', book: 'Cambridge 18', test: 'Test 2', part: 'Part 2', audioUrl: '/audio/listening/Test 2 Part 2.mp3', lrcUrl: '/audio/listening/Test 2 Part 2.mp3.lrc', duration: '10:00' },
  { id: 'c18-t2-p3', title: 'Test 2 - Part 3: Research Project', book: 'Cambridge 18', test: 'Test 2', part: 'Part 3', audioUrl: '/audio/listening/Test 2 Part 3.mp3', lrcUrl: '/audio/listening/Test 2 Part 3.mp3.lrc', duration: '10:00' },
  { id: 'c18-t2-p4', title: 'Test 2 - Part 4: Weather Cycles', book: 'Cambridge 18', test: 'Test 2', part: 'Part 4', audioUrl: '/audio/listening/Test 2 Part 4.mp3', lrcUrl: '/audio/listening/Test 2 Part 4.mp3.lrc', duration: '10:00' },
  { id: 'c18-t3-p1', title: 'Test 3 - Part 1: Car Insurance', book: 'Cambridge 18', test: 'Test 3', part: 'Part 1', audioUrl: '/audio/listening/Test 3 Part 1.mp3', lrcUrl: '/audio/listening/Test 3 Part 1.mp3.lrc', duration: '10:00' },
  { id: 'c18-t3-p2', title: 'Test 3 - Part 2: Hotel', book: 'Cambridge 18', test: 'Test 3', part: 'Part 2', audioUrl: '/audio/listening/Test 3 Part 2.mp3', lrcUrl: '/audio/listening/Test 3 Part 2.mp3.lrc', duration: '10:00' },
  { id: 'c18-t3-p3', title: 'Test 3 - Part 3: Group Project', book: 'Cambridge 18', test: 'Test 3', part: 'Part 3', audioUrl: '/audio/listening/Test 3 Part 3.mp3', lrcUrl: '/audio/listening/Test 3 Part 3.mp3.lrc', duration: '10:00' },
  { id: 'c18-t3-p4', title: 'Test 3 - Part 4: Music History', book: 'Cambridge 18', test: 'Test 3', part: 'Part 4', audioUrl: '/audio/listening/Test 3 Part 4.mp3', lrcUrl: '/audio/listening/Test 3 Part 4.mp3.lrc', duration: '10:00' },
  { id: 'c18-t4-p1', title: 'Test 4 - Part 1: Volunteer Work', book: 'Cambridge 18', test: 'Test 4', part: 'Part 1', audioUrl: '/audio/listening/Test 4 Part 1.mp3', lrcUrl: '/audio/listening/Test 4 Part 1.mp3.lrc', duration: '10:00' },
  { id: 'c18-t4-p2', title: 'Test 4 - Part 2: Garden Festival', book: 'Cambridge 18', test: 'Test 4', part: 'Part 2', audioUrl: '/audio/listening/Test 4 Part 2.mp3', lrcUrl: '/audio/listening/Test 4 Part 2.mp3.lrc', duration: '10:00' },
  { id: 'c18-t4-p3', title: 'Test 4 - Part 3: Study Skills', book: 'Cambridge 18', test: 'Test 4', part: 'Part 3', audioUrl: '/audio/listening/Test 4 Part 3.mp3', lrcUrl: '/audio/listening/Test 4 Part 3.mp3.lrc', duration: '10:00' },
  { id: 'c18-t4-p4', title: 'Test 4 - Part 4: Urban Wildlife', book: 'Cambridge 18', test: 'Test 4', part: 'Part 4', audioUrl: '/audio/listening/Test 4 Part 4.mp3', lrcUrl: '/audio/listening/Test 4 Part 4.mp3.lrc', duration: '10:00' },
];

export const books = ['All', 'Cambridge 14', 'Cambridge 15', 'Cambridge 16', 'Cambridge 17', 'Cambridge 18'];
export const tests = ['All', 'Test 1', 'Test 2', 'Test 3', 'Test 4'];
export const parts = ['All', 'Part 1', 'Part 2', 'Part 3', 'Part 4'];
