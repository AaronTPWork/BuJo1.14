import React, { useEffect, useState } from 'react';
import { PencilPage, DownloadIcon, LockIcon, SearchIcon } from '../../../Components/icons';
import { FloatingMenu } from './components/FloatingMenu';
import { useDailyJournalNotes } from '../../../Services/Journal/hooks';
import { BulletIcon } from './components/BulletIcon';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJournal, editJournal } from '../../../Services/Journal';
import { todayDate, useGlobalValues } from '../../../Stores/GlobalValues';
import { EditNoteModal } from './modals/EditNoteModal';

function debounce(func, delay) {
  let timeoutId;

  return function () {
    const context = this;
    const args = arguments;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

export const InputArea = ({ value, handleInput, note, index }) => {
  const [localValue, setLocalValue] = useState('');
  useEffect(() => {
    setLocalValue(note.text_stream);
  }, [note.text_stream]);

  return (
    <input
      // style={{ height: '30px' }}
      type="text"
      className="border-none outline-none border-gray-300 p-1 leading-6 whitespace-pre-wrap"
      placeholder="Type your note here..."
      value={localValue ?? ''}
      onChange={(e) => setLocalValue(e.target.value)}
      onKeyDown={(e) => handleInput(e, note, index, localValue)}
    />
  );
};

const NoteWithAnnotations = () => {
  const [showPrimaryFloatingMenu, setShowPrimaryFloatingMenu] = useState(false);
  const [showSecondaryFloatingMenu, setShowSecondaryFloatingMenu] = useState(false);
  const [floatingMenuPosition, setFloatingMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const {
    selectedDate,
    selectedProject,
    selectedUserId,
    actions: { showSearch },
  } = useGlobalValues();

  const { notes } = useDailyJournalNotes(selectedDate);
  const [currentNote, setcurrentNote] = useState();
  const [showModal, setshowModal] = useState(false);
  const qClient = useQueryClient();

  const filteredNotesByProjectStream = notes?.filter(
    (note) => note.project_stream === selectedProject && note.user_id === selectedUserId
  );

  const invalidateQueries = () => {
    qClient.invalidateQueries({
      queryKey: ['journals'],
    });
    qClient.invalidateQueries({
      queryKey: ['journals', selectedDate],
    });
  };

  const { mutate: createNote } = useMutation({
    mutationFn: createJournal,
    onSettled: () => {
      invalidateQueries();
    },
  });
  const { mutate: editNote } = useMutation({
    mutationFn: editJournal,
    onSettled: () => {
      invalidateQueries();
    },
  });

  const handlePrimaryClick = ({ event, note }) => {
    setcurrentNote(note);
    const buttonPosition = event.target.getBoundingClientRect();
    setShowSecondaryFloatingMenu(false);
    setFloatingMenuPosition({ x: buttonPosition.x, y: buttonPosition.y });
    setShowPrimaryFloatingMenu(true);
  };

  const handleSecondaryClick = ({ event, note }) => {
    setcurrentNote(note);
    const buttonPosition = event.target.getBoundingClientRect();
    setShowPrimaryFloatingMenu(false);
    setFloatingMenuPosition({ x: buttonPosition.x, y: buttonPosition.y });
    setShowSecondaryFloatingMenu(true);
  };

  const closeMenu = () => {
    setShowPrimaryFloatingMenu(false);
    setShowSecondaryFloatingMenu(false);
    setFloatingMenuPosition({
      x: 0,
      y: 0,
    });
  };

  const handleInput = (e, note, index, value) => {
    const newText = value;
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!note.id) {
        // debounce(() => {
        //   const newNote = {
        //     date_created: selectedDate,
        //     user_id: selectedUserId,
        //     text_stream: newText,
        //   };
        //   console.log('🚀 ~ handleInput ~ note:', newNote);
        //   if (selectedProject) newNote.project_stream = selectedProject;
        //   return createNote(newNote);
        // }, 500);
        const newNote = {
          date_created: selectedDate ?? todayDate,
          user_id: selectedUserId,
          text_stream: newText,
        };
        console.log('🚀 ~ handleInput ~ note:', newNote);
        if (selectedProject) newNote.project_stream = selectedProject;
        createNote(newNote);
      } else {
        debounce(
          editNote({
            ...note,
            text_stream: newText,
          }),
          500
        );
      }
    }
  };

  const selectPrimaryIcon = (iconId) => {
    if (!currentNote.id) {
      const newNote = {
        date_created: selectedDate ?? todayDate,
        user_id: selectedUserId,
        bullet_stream: iconId,
      };
      if (selectedProject) newNote.project_stream = selectedProject;
      createNote(newNote);
    } else {
      editNote({
        ...currentNote,
        bullet_stream: iconId,
      });
    }
    setShowPrimaryFloatingMenu(false);
  };

  const selectSecondaryIcon = (iconId) => {
    if (!currentNote.id) {
      const newNote = {
        date_created: selectedDate ?? todayDate,
        project_stream: selectedProject,
        user_id: selectedUserId,
        context_stream: iconId ?? '0',
      };
      if (selectedProject) newNote.project_stream = selectedProject;
      createNote(newNote);
    } else {
      editNote({
        ...currentNote,
        context_stream: iconId ?? '0',
      });
    }
    setShowSecondaryFloatingMenu(false);
  };

  return (
    <div className="flex flex-col w-3/4 border-x">
      <div className="flex justify-between h-20 border">
        <PencilPage styles={'h-10 my-auto ml-5'} />
        <div className="flex gap-x-5">
          <div className="flex px-5 my-auto border-r h-fit">
            <LockIcon styles={'w-10 my-auto'} />
          </div>

          <button className="">
            <DownloadIcon styles={'h-10'} />
          </button>
          <div
            onClick={() => {
              showSearch();
            }}
            className="flex px-5 my-auto border-l h-fit cursor-pointer"
          >
            <SearchIcon styles={'w-10 my-auto'} />
          </div>
        </div>
      </div>
      <div className="flex h-[85%] overflow-scroll">
        <div className="flex flex-col h-full w-full pt-1 border-r border-r-[#e5e7eb] relative">
          <div className="border-r border-r-[#e5e7eb] w-[6%] h-[100%] absolute" />
          <div className="border-r border-r-[#e5e7eb] w-[13%] h-full absolute" />
          {selectedUserId &&
            selectedUserId.length > 0 &&
            [...(filteredNotesByProjectStream || []), {}]?.map((note, index) => {
              return (
                <div key={`note-detail-${index}`} className="flex w-full items-start">
                  <div className="w-[7%] h-full flex justify-center items-center ">
                    <BulletIcon
                      refName={'ref_context'}
                      note={note}
                      selectedIconId={note.context_stream}
                      getIconName={(ref) => `${ref.name}`}
                      handleClick={handleSecondaryClick}
                      index={index}
                    />
                  </div>
                  <div className="w-[9%] h-full flex justify-center items-center ">
                    <BulletIcon
                      refName={'ref_bullet'}
                      note={note}
                      selectedIconId={note.bullet_stream}
                      getIconName={(ref) => `${ref.ref}-${ref.state}-${ref.name}`}
                      handleClick={handlePrimaryClick}
                      index={index}
                    />
                  </div>
                  <div className="flex flex-col w-full  pl-1">
                    <InputArea handleInput={handleInput} note={note} index={index} />
                  </div>
                  {note.id && (
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        setcurrentNote(note);
                        setshowModal(true);
                      }}
                    >
                      <PencilPage styles={'h-7 my-auto'} />
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
      {showPrimaryFloatingMenu && (
        <FloatingMenu
          floatingMenuPosition={floatingMenuPosition}
          closeMenu={closeMenu}
          selectIcon={selectPrimaryIcon}
          refName={'ref_bullet'}
          getIconName={(ref) => `${ref.ref}-${ref.state}-${ref.name}`}
        />
      )}
      {showSecondaryFloatingMenu && (
        <FloatingMenu
          floatingMenuPosition={floatingMenuPosition}
          closeMenu={closeMenu}
          selectIcon={selectSecondaryIcon}
          refName={'ref_context'}
          getIconName={(ref) => `${ref.name}`}
        />
      )}
      {showModal && (
        <EditNoteModal
          currentNote={currentNote}
          isModalOpen={showModal}
          closeModal={() => {
            setcurrentNote(null);
            setshowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default NoteWithAnnotations;
